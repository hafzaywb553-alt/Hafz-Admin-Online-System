import { router, json, error, requireAuth, requireAdminEmailAllowlist } from '@appdeploy/sdk';
import { db } from '@appdeploy/sdk';
import { realtimeSubscriptionRoutes, notifySubscribers } from './realtime-subscribers';

const ADMIN_EMAILS = ['hafzaywb553@gmail.com'];
const PRESENCE_TTL_MS = 45_000;

const now = () => new Date().toISOString();

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function isAdmin(ctx: any) {
  return ADMIN_EMAILS.includes(normalizeEmail(ctx.user?.email));
}

function moneyNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function textValue(value: unknown) {
  return String(value ?? '').trim();
}

function validDate(value: unknown) {
  const text = textValue(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text + 'T00:00:00Z'));
}

function withOwner(record: Record<string, unknown>, fallbackEmail = ''): Record<string, unknown> {
  return {
    ...record,
    ownerEmail: normalizeEmail(record.ownerEmail) || normalizeEmail(fallbackEmail),
  };
}

async function audit(ctx: any, action: string, details: Record<string, unknown> = {}) {
  try {
    await db.add('audit', [{
      userId: ctx.user!.userId,
      email: normalizeEmail(ctx.user!.email),
      action,
      details,
      createdAt: now(),
    }]);
  } catch (e) {
    console.warn('audit_write_failed', e);
  }
}

async function listAll(table: string, limit = 500) {
  return db.list<Record<string, unknown>>(table, { limit });
}

async function listScoped(ctx: any, table: string) {
  const r = await listAll(table);
  const admin = isAdmin(ctx);
  const filtered = admin ? r.items : r.items.filter(x => String(x.userId || '') === ctx.user!.userId);
  filtered.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return {
    items: filtered.map(x => withOwner(x, admin ? '' : ctx.user!.email || '')),
    nextToken: r.nextToken,
  };
}

async function addUserRecord(
  ctx: any,
  table: string,
  record: Record<string, unknown>,
  action: string
) {
  const stored = {
    ...record,
    userId: ctx.user!.userId,
    ownerEmail: normalizeEmail(ctx.user!.email),
    createdAt: now(),
  };
  const [id] = await db.add(table, [stored]);
  if (!id) return error('د ثبتولو ستونزه', 500);
  await audit(ctx, action, { table, id });
  return json({ ok: true, id, item: withOwner({ ...stored, id }, ctx.user!.email || '') });
}

async function getRecord(table: string, id: string) {
  const [record] = await db.get<Record<string, unknown>>(table, [id]);
  return record;
}

function canManage(ctx: any, record: Record<string, unknown>) {
  return isAdmin(ctx) || String(record.userId || '') === ctx.user!.userId;
}

const DEFENSE_TAX_PROFILE_LABEL = 'د ملي دفاع وزارت';

function generalSalaryWithholdingTaxMonthly(amount: number) {
  const taxable = Math.max(0, moneyNumber(amount) || 0);
  if (taxable <= 5000) return 0;
  if (taxable <= 12500) return Math.round((taxable - 5000) * 0.02 * 100) / 100;
  if (taxable <= 100000) return Math.round((150 + (taxable - 12500) * 0.1) * 100) / 100;
  return Math.round((8900 + (taxable - 100000) * 0.2) * 100) / 100;
}

function defenseSalaryTaxInternal(amount: number) {
  const taxable = Math.max(0, moneyNumber(amount) || 0);
  if (taxable <= 10000) return 0;
  if (taxable <= 100000) return Math.round(taxable * 0.1 * 100) / 100;
  return Math.round(taxable * 0.15 * 100) / 100;
}

function salaryTaxByInstitution(amount: number, institution: string) {
  return institution === DEFENSE_TAX_PROFILE_LABEL
    ? defenseSalaryTaxInternal(amount)
    : generalSalaryWithholdingTaxMonthly(amount);
}

function positiveAmount(value: unknown) {
  const amount = moneyNumber(value);
  return amount !== null && amount > 0 ? amount : null;
}

async function presencePayload() {
  const page = await listAll('presence');
  const cutoff = Date.now() - PRESENCE_TTL_MS;
  const active = page.items.filter(x => {
    const seen = Date.parse(String(x.lastSeen || ''));
    return x.online !== false && Number.isFinite(seen) && seen >= cutoff;
  });
  const users = new Map<string, Record<string, unknown>>();
  for (const x of active) {
    const userId = String(x.userId || '');
    if (!userId) continue;
    const current = users.get(userId);
    if (!current || Date.parse(String(x.lastSeen || '')) > Date.parse(String(current.lastSeen || ''))) {
      users.set(userId, {
        userId,
        email: normalizeEmail(x.email),
        name: textValue(x.name) || normalizeEmail(x.email) || 'کاروونکی',
        lastSeen: x.lastSeen,
      });
    }
  }
  const result = Array.from(users.values()).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ps'));
  return { count: result.length, users: result, ttlSeconds: PRESENCE_TTL_MS / 1000 };
}

async function broadcastPresence() {
  try {
    await notifySubscribers('presence', 'global', await presencePayload());
  } catch (e) {
    console.warn('presence_broadcast_failed', e);
  }
}

async function updatePresence(ctx: any, online: boolean) {
  const body = (ctx.body || {}) as Record<string, unknown>;
  const sessionId = textValue(body.sessionId);
  if (!sessionId) return error('sessionId اړین دی.', 400);

  const page = await listAll('presence');
  const current = page.items.find(x => x.sessionId === sessionId && String(x.userId || '') === ctx.user!.userId);
  const record = {
    ...(current || {}),
    userId: ctx.user!.userId,
    email: normalizeEmail(ctx.user!.email),
    name: textValue(ctx.user!.name) || normalizeEmail(ctx.user!.email) || 'کاروونکی',
    sessionId,
    lastSeen: now(),
    online,
    updatedAt: now(),
  };

  if (current) {
    const ok = await db.update('presence', [{ id: current.id, record }]);
    if (!ok[0]) return error('د آنلاین حالت تازه کول ناکام شول.', 500);
    await broadcastPresence();
    return json({ ok: true, presenceId: current.id, ...(await presencePayload()) });
  }

  const [id] = await db.add('presence', [record]);
  if (!id) return error('د آنلاین حالت ثبتول ناکام شول.', 500);
  await broadcastPresence();
  return json({ ok: true, presenceId: id, ...(await presencePayload()) });
}

export const handler = router({
  'GET /api/personnel': [
    requireAuth(),
    async ctx => json(await listScoped(ctx, 'personnel')),
  ],
  'POST /api/personnel': [
    requireAuth(),
    async ctx => {
      const body = (ctx.body || {}) as Record<string, unknown>;
      const name = textValue(body.name);
      const employeeNo = textValue(body.employeeNo);
      const rank = textValue(body.rank);
      const position = textValue(body.position);
      const baseSalary = moneyNumber(body.baseSalary);
      const recurringAllowance = moneyNumber(body.recurringAllowance);
      const extraordinaryAllowance = moneyNumber(body.extraordinaryAllowance ?? 0);
      const fees = moneyNumber(body.fees ?? 0);
      if (!name || !employeeNo || baseSalary === null || baseSalary < 0 || recurringAllowance === null || recurringAllowance < 0 || extraordinaryAllowance === null || extraordinaryAllowance < 0 || fees === null || fees < 0) {
        return error('د کارکوونکي معلومات او مالي ارقام سم داخل کړئ.', 400);
      }
      const existing = await listAll('personnel');
      if (existing.items.some(x => String(x.userId || '') === ctx.user!.userId && String(x.employeeNo || '').trim().toLowerCase() === employeeNo.toLowerCase())) {
        return error('د کارکوونکي شمېره مخکې ثبت شوې ده.', 409);
      }
      return addUserRecord(ctx, 'personnel', { name, employeeNo, rank, position, baseSalary, recurringAllowance, extraordinaryAllowance, fees }, 'create_personnel');
    },
  ],
  'PUT /api/personnel/:id': [
    requireAuth(),
    async ctx => {
      const id = textValue(ctx.params.id);
      const existing = await getRecord('personnel', id);
      if (!existing || !canManage(ctx, existing)) return error('د کارکوونکي د سمون صلاحیت نشته.', 403);
      const body = (ctx.body || {}) as Record<string, unknown>;
      const name = textValue(body.name);
      const employeeNo = textValue(body.employeeNo);
      const rank = textValue(body.rank);
      const position = textValue(body.position);
      const baseSalary = moneyNumber(body.baseSalary);
      const recurringAllowance = moneyNumber(body.recurringAllowance);
      const extraordinaryAllowance = moneyNumber(body.extraordinaryAllowance ?? 0);
      const fees = moneyNumber(body.fees ?? 0);
      if (!name || !employeeNo || baseSalary === null || baseSalary < 0 || recurringAllowance === null || recurringAllowance < 0 || extraordinaryAllowance === null || extraordinaryAllowance < 0 || fees === null || fees < 0) {
        return error('د کارکوونکي معلومات او مالي ارقام سم داخل کړئ.', 400);
      }
      const existingPeople = await listAll('personnel');
      if (existingPeople.items.some(x => String(x.id) !== id && String(x.userId || '') === String(existing.userId || '') && String(x.employeeNo || '').trim().toLowerCase() === employeeNo.toLowerCase())) {
        return error('د کارکوونکي شمېره مخکې ثبت شوې ده.', 409);
      }
      const record = { ...existing, name, employeeNo, rank, position, baseSalary, recurringAllowance, extraordinaryAllowance, fees, updatedAt: now() };
      const ok = await db.update('personnel', [{ id, record }]);
      if (!ok[0]) return error('د کارکوونکي سمون ونه شو.', 500);
      await audit(ctx, 'update_personnel', { id });
      return json({ ok: true, item: withOwner({ ...record, id }, String(existing.ownerEmail || ctx.user!.email || '')) });
    },
  ],
  'DELETE /api/personnel/:id': [
    requireAuth(),
    async ctx => {
      const id = textValue(ctx.params.id);
      const existing = await getRecord('personnel', id);
      if (!existing || !canManage(ctx, existing)) return error('د کارکوونکي د حذف صلاحیت نشته.', 403);
      const related = (await listAll('payroll')).items.filter(x => x.personId === id && String(x.userId || '') === String(existing.userId || '')).map(x => x.id);
      if (related.length) await db.delete('payroll', related.slice(0, 500));
      const ok = await db.delete('personnel', [id]);
      if (!ok[0]) return error('کارکوونکی حذف نه شو.', 500);
      await audit(ctx, 'delete_personnel', { id, payrollDeleted: related.length });
      return json({ ok: true, deletedPayroll: related.length });
    },
  ],
  'GET /api/payroll': [
    requireAuth(),
    async ctx => json(await listScoped(ctx, 'payroll')),
  ],
  'POST /api/payroll': [
    requireAuth(),
    async ctx => {
      const body = (ctx.body || {}) as Record<string, unknown>;
      const personId = textValue(body.personId);
      const month = textValue(body.month);
      if (!personId || !/^\d{4}-\d{2}$/.test(month)) return error('کارکوونکی او معتبره میاشت وټاکئ.', 400);
      const person = await getRecord('personnel', personId);
      if (!person || String(person.userId || '') !== ctx.user!.userId) return error('کارکوونکی ونه موندل شو.', 404);
      const existingPayroll = await listAll('payroll');
      if (existingPayroll.items.some(x => String(x.userId || '') === ctx.user!.userId && x.personId === personId && x.month === month)) return error('د همدې کارکوونکي لپاره دا میاشت مخکې ثبت شوې ده.', 409);
      const baseSalary = moneyNumber(person.baseSalary);
      const recurringAllowance = moneyNumber(person.recurringAllowance);
      const extraordinaryAllowance = moneyNumber(body.extraordinaryAllowance ?? 0);
      const otherDeductions = moneyNumber(body.otherDeductions ?? 0);
      if ([baseSalary, recurringAllowance, extraordinaryAllowance, otherDeductions].some(v => v === null || v < 0)) return error('د معاش مالي ارقام سم نه دي.', 400);
      const gross = Math.round((baseSalary! + recurringAllowance! + extraordinaryAllowance!) * 100) / 100;
      const institution = textValue(body.institution) || DEFENSE_TAX_PROFILE_LABEL;
      const taxableIncome = baseSalary!;
      const taxAmount = salaryTaxByInstitution(taxableIncome, institution);
      const totalDeductions = Math.round((taxAmount + otherDeductions!) * 100) / 100;
      const net = Math.round((gross - totalDeductions) * 100) / 100;
      if (net < 0) return error('ټول کسرات له ناخالص معاش څخه زیات کېدای نه شي.', 400);
      return addUserRecord(ctx, 'payroll', { personId, institution, month, baseSalary, recurringAllowance, extraordinaryAllowance, otherDeductions, taxableIncome, taxAmount, totalDeductions, fees: totalDeductions, gross, net }, 'create_payroll');
    },
  ],
  'PUT /api/payroll/:id': [
    requireAuth(),
    async ctx => {
      const id = textValue(ctx.params.id);
      const existing = await getRecord('payroll', id);
      if (!existing || !canManage(ctx, existing)) return error('د معاش د سمون صلاحیت نشته.', 403);
      const body = (ctx.body || {}) as Record<string, unknown>;
      const personId = textValue(body.personId || existing.personId);
      const month = textValue(body.month || existing.month);
      const person = await getRecord('personnel', personId);
      if (!person || String(person.userId || '') !== String(existing.userId || '')) return error('اړوند کارکوونکی ونه موندل شو.', 404);
      const extraordinaryAllowance = moneyNumber(body.extraordinaryAllowance ?? existing.extraordinaryAllowance ?? 0);
      const existingOther = moneyNumber(existing.otherDeductions ?? 0) || 0;
      const otherDeductions = moneyNumber(body.otherDeductions ?? existingOther);
      const baseSalary = moneyNumber(person.baseSalary);
      const recurringAllowance = moneyNumber(person.recurringAllowance);
      if (!/^\d{4}-\d{2}$/.test(month) || [baseSalary, recurringAllowance, extraordinaryAllowance, otherDeductions].some(v => v === null || v < 0)) return error('د معاش معلومات سم نه دي.', 400);
      const duplicates = (await listAll('payroll')).items.some(x => String(x.id) !== id && String(x.userId || '') === String(existing.userId || '') && x.personId === personId && x.month === month);
      if (duplicates) return error('د همدې کارکوونکي لپاره دا میاشت مخکې ثبت شوې ده.', 409);
      const gross = Math.round((baseSalary! + recurringAllowance! + extraordinaryAllowance!) * 100) / 100;
      const institution = textValue(body.institution || existing.institution) || DEFENSE_TAX_PROFILE_LABEL;
      const taxableIncome = baseSalary!;
      const taxAmount = salaryTaxByInstitution(taxableIncome, institution);
      const totalDeductions = Math.round((taxAmount + otherDeductions!) * 100) / 100;
      const net = Math.round((gross - totalDeductions) * 100) / 100;
      if (net < 0) return error('ټول کسرات له ناخالص معاش څخه زیات کېدای نه شي.', 400);
      const record = { ...existing, personId, institution, month, baseSalary, recurringAllowance, extraordinaryAllowance, otherDeductions, taxableIncome, taxAmount, totalDeductions, fees: totalDeductions, gross, net, updatedAt: now() };
      const ok = await db.update('payroll', [{ id, record }]);
      if (!ok[0]) return error('معاش سم نه شو.', 500);
      await audit(ctx, 'update_payroll', { id });
      return json({ ok: true, item: withOwner({ ...record, id }, String(existing.ownerEmail || ctx.user!.email || '')) });
    },
  ],
  'DELETE /api/payroll/:id': [
    requireAuth(),
    async ctx => {
      const id = textValue(ctx.params.id);
      const existing = await getRecord('payroll', id);
      if (!existing || !canManage(ctx, existing)) return error('د معاش د حذف صلاحیت نشته.', 403);
      const ok = await db.delete('payroll', [id]);
      if (!ok[0]) return error('معاش حذف نه شو.', 500);
      await audit(ctx, 'delete_payroll', { id });
      return json({ ok: true });
    },
  ],
  'GET /api/transactions': [
    requireAuth(),
    async ctx => json(await listScoped(ctx, 'transactions')),
  ],
  'POST /api/transactions': [
    requireAuth(),
    async ctx => {
      const body = (ctx.body || {}) as Record<string, unknown>;
      const description = textValue(body.description);
      const type = textValue(body.type);
      const amount = positiveAmount(body.amount);
      const category = textValue(body.category);
      const date = textValue(body.date) || now().slice(0, 10);
      const note = textValue(body.note);
      const referenceNo = textValue(body.referenceNo);
      if (!description || (type !== 'income' && type !== 'expense') || amount === null || !validDate(date)) return error('تشریح، ډول، مثبت مقدار او سمه نېټه اړین دي.', 400);
      return addUserRecord(ctx, 'transactions', { description, type, amount, category, date, note, referenceNo }, 'create_transaction');
    },
  ],
  'PUT /api/transactions/:id': [
    requireAuth(),
    async ctx => {
      const id = textValue(ctx.params.id);
      const existing = await getRecord('transactions', id);
      if (!existing || !canManage(ctx, existing)) return error('د مالي ثبت د سمون صلاحیت نشته.', 403);
      const body = (ctx.body || {}) as Record<string, unknown>;
      const description = textValue(body.description || existing.description);
      const type = textValue(body.type || existing.type);
      const amount = positiveAmount(body.amount ?? existing.amount);
      const category = textValue(body.category ?? existing.category);
      const date = textValue(body.date || existing.date);
      const note = textValue(body.note ?? existing.note);
      const referenceNo = textValue(body.referenceNo ?? existing.referenceNo);
      if (!description || (type !== 'income' && type !== 'expense') || amount === null || !validDate(date)) return error('مالي معلومات سمې کړئ.', 400);
      const record = { ...existing, description, type, amount, category, date, note, referenceNo, updatedAt: now() };
      const ok = await db.update('transactions', [{ id, record }]);
      if (!ok[0]) return error('مالي ثبت سم نه شو.', 500);
      await audit(ctx, 'update_transaction', { id });
      return json({ ok: true, item: withOwner({ ...record, id }, String(existing.ownerEmail || ctx.user!.email || '')) });
    },
  ],
  'DELETE /api/transactions/:id': [
    requireAuth(),
    async ctx => {
      const id = textValue(ctx.params.id);
      const existing = await getRecord('transactions', id);
      if (!existing || !canManage(ctx, existing)) return error('د مالي ثبت د حذف صلاحیت نشته.', 403);
      const ok = await db.delete('transactions', [id]);
      if (!ok[0]) return error('مالي ثبت حذف نه شو.', 500);
      await audit(ctx, 'delete_transaction', { id });
      return json({ ok: true });
    },
  ],
  'GET /api/ledger': [
    requireAuth(),
    async ctx => {
      const admin = isAdmin(ctx);
      const userId = ctx.user!.userId;
      const [txPage, payrollPage] = await Promise.all([listAll('transactions'), listAll('payroll')]);
      const tx = admin ? txPage.items : txPage.items.filter(x => String(x.userId || '') === userId);
      const payroll = admin ? payrollPage.items : payrollPage.items.filter(x => String(x.userId || '') === userId);
      const items: Array<Record<string, unknown>> = [];
      for (const x of tx) {
        const amount = moneyNumber(x.amount) || 0;
        const ref = `TX-${String(x.id).slice(0, 8)}`;
        const ownerEmail = normalizeEmail(x.ownerEmail);
        if (x.type === 'income') {
          items.push({ id: `${x.id}-d`, sourceId: x.id, date: x.date, reference: ref, account: '1100 - نغدې/بانک', debit: amount, credit: 0, description: x.description, ownerEmail });
          items.push({ id: `${x.id}-c`, sourceId: x.id, date: x.date, reference: ref, account: '4100 - عواید', debit: 0, credit: amount, description: x.description, ownerEmail });
        } else {
          items.push({ id: `${x.id}-d`, sourceId: x.id, date: x.date, reference: ref, account: '5100 - مصارف', debit: amount, credit: 0, description: x.description, ownerEmail });
          items.push({ id: `${x.id}-c`, sourceId: x.id, date: x.date, reference: ref, account: '1100 - نغدې/بانک', debit: 0, credit: amount, description: x.description, ownerEmail });
        }
      }
      for (const x of payroll) {
        const gross = moneyNumber(x.gross) || 0;
        const net = moneyNumber(x.net) || 0;
        const fees = moneyNumber(x.fees) || 0;
        const ref = `PR-${String(x.id).slice(0, 8)}`;
        const date = validDate(String(x.month) + '-01') ? String(x.month) + '-01' : now().slice(0, 10);
        const ownerEmail = normalizeEmail(x.ownerEmail);
        items.push({ id: `${x.id}-d`, sourceId: x.id, date, reference: ref, account: '6100 - د معاشونو مصارف', debit: gross, credit: 0, description: `معاش - ${x.month}`, ownerEmail });
        items.push({ id: `${x.id}-c`, sourceId: x.id, date, reference: ref, account: '2100 - د معاشونو وجبات', debit: 0, credit: net, description: `خالص معاش - ${x.month}`, ownerEmail });
        if (fees > 0) items.push({ id: `${x.id}-f`, sourceId: x.id, date, reference: ref, account: '2200 - د کسراتو وجبات', debit: 0, credit: fees, description: `کسرات/فیسونه - ${x.month}`, ownerEmail });
      }
      items.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.reference).localeCompare(String(b.reference)));
      const debitTotal = items.reduce((s, x) => s + Number(x.debit || 0), 0);
      const creditTotal = items.reduce((s, x) => s + Number(x.credit || 0), 0);
      return json({ items, balanced: Math.abs(debitTotal - creditTotal) < 0.01, debitTotal, creditTotal });
    },
  ],
  'GET /api/compliance': [
    requireAuth(),
    async () => json({
      baselineDate: '2026-09-01',
      solarDate: '۱۴۰۵/۶/۱۰',
      officialIndex: 'https://mof.gov.af/ps/قوانین-او-مقررات',
      proceduresIndex: 'https://mof.gov.af/ps/طرزالعملونه',
    }),
  ],
  'GET /api/audit': [
    requireAuth(),
    async ctx => json(await listScoped(ctx, 'audit')),
  ],
  'POST /api/profile': [
    requireAuth(),
    async ctx => {
      const profile = {
        userId: ctx.user!.userId,
        email: normalizeEmail(ctx.user!.email),
        name: textValue(ctx.user!.name),
        role: isAdmin(ctx) ? 'admin' : 'user',
        updatedAt: now(),
      };
      const page = await listAll('user_profiles');
      const current = page.items.find(x => String(x.userId || '') === ctx.user!.userId);
      if (current) {
        const ok = await db.update('user_profiles', [{ id: current.id, record: { ...current, ...profile } }]);
        if (!ok[0]) return error('د پروفایل تازه کول ناکام شول.', 500);
        return json({ ok: true, id: current.id, profile });
      }
      const [id] = await db.add('user_profiles', [profile]);
      if (!id) return error('د پروفایل ثبتول ناکام شول.', 500);
      return json({ ok: true, id, profile });
    },
  ],
  'GET /api/profile': [
    requireAuth(),
    async ctx => json({
      userId: ctx.user!.userId,
      email: normalizeEmail(ctx.user!.email),
      name: ctx.user!.name,
      role: isAdmin(ctx) ? 'admin' : 'user',
    }),
  ],
  'GET /api/presence': [
    requireAuth(),
    async () => json(await presencePayload()),
  ],
  'POST /api/presence/heartbeat': [
    requireAuth(),
    async ctx => updatePresence(ctx, true),
  ],
  'POST /api/presence/offline': [
    requireAuth(),
    async ctx => updatePresence(ctx, false),
  ],
  'GET /api/admin/overview': [
    requireAuth(),
    requireAdminEmailAllowlist(ADMIN_EMAILS),
    async () => {
      const [profiles, personnel, payroll, transactions, auditPage, presence] = await Promise.all([
        listAll('user_profiles'),
        listAll('personnel'),
        listAll('payroll'),
        listAll('transactions'),
        listAll('audit'),
        presencePayload(),
      ]);
      const byUser = new Map<string, string>();
      for (const p of profiles.items) byUser.set(String(p.userId || ''), normalizeEmail(p.email));
      const decorate = (items: Array<Record<string, unknown>>) => items
        .map(x => withOwner(x, byUser.get(String(x.userId || '')) || ''))
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return json({
        users: profiles.items.map(x => ({ ...x, id: x.id, email: normalizeEmail(x.email) })).sort((a, b) => String(a.email).localeCompare(String(b.email))),
        personnel: decorate(personnel.items),
        payroll: decorate(payroll.items),
        transactions: decorate(transactions.items),
        audit: decorate(auditPage.items),
        presence,
      });
    },
  ],
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  ...realtimeSubscriptionRoutes,
});
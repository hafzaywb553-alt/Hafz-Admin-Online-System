using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Text;
using System.Windows.Forms;

namespace HafzMaliOffline
{
    public class MainForm : Form
    {
        private readonly Color Bg = Color.FromArgb(7,22,49);
        private readonly Color Panel = Color.FromArgb(13,36,66);
        private readonly Color Field = Color.FromArgb(6,19,38);
        private readonly Color Border = Color.FromArgb(36,72,108);
        private readonly Color TextC = Color.FromArgb(244,248,255);
        private readonly Color Muted = Color.FromArgb(173,190,210);
        private readonly Color Number = Color.FromArgb(255,212,102);
        private readonly Color Accent = Color.FromArgb(29,143,209);

        private readonly string dataPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "HafzMaliOffline", "salary.txt");

        private Panel content, salaryPanel, contactPanel, settingsPanel;
        private Button salaryNav, contactNav, settingsNav;
        private TextBox nameBox, professional;
        private ComboBox sector, institution, month, rank, education, status;
        private NumericUpDown startDay, calcDays, attendanceDays, serviceYears;
        private TextBox baseSalary, educationAmount, serviceAmount, feedingTotal;
        private Label kBase, kAllow, kTax, kNet, periodNote;
        private DataGridView grid;
        private bool loading;

        private static readonly string[] Months = {
            "حمل","ثور","جوزا","سرطان","اسد","سنبله","میزان","عقرب","قوس","جدی","دلو","حوت"
        };
        private static readonly int[] MonthLengths = {31,31,31,31,31,31,30,30,30,30,30,29};
        private static readonly string[] Military = {
            "ستر جنرال / ستر پاسوال","ډګر جنرال / لوی پاسوال","تورن جنرال / پاسوال","برید جنرال / مل پاسوال",
            "ډګروال / سمونوال","ډګرمن / سمونمل","جګړن / سمونیار","تورن / څارمن",
            "لومړی بریدمن / لومړی څارن","دوهم بریدمن / دوهم څارن","سرپرکمشر قدمدار / لومړی ساتنمن",
            "معاون سرپرکمشر قدمدار / دوهم ساتنمن","سرپرکمشر / درېیم ساتنمن","معاون سرپرکمشر","پرکمشر","ساتونکی"
        };
        private static readonly string[] Civilian = {"اوم بست — اول قدم","اتم بست — اول قدم"};
        private static readonly Dictionary<string,int> Salaries = new Dictionary<string,int> {
            {"ستر جنرال / ستر پاسوال",36100},{"ډګر جنرال / لوی پاسوال",33155},{"تورن جنرال / پاسوال",27550},{"برید جنرال / مل پاسوال",24035},
            {"ډګروال / سمونوال",19665},{"ډګرمن / سمونمل",17860},{"جګړن / سمونیار",16150},{"تورن / څارمن",14345},
            {"لومړی بریدمن / لومړی څارن",12825},{"دوهم بریدمن / دوهم څارن",11685},{"سرپرکمشر قدمدار / لومړی ساتنمن",11210},
            {"معاون سرپرکمشر قدمدار / دوهم ساتنمن",11115},{"سرپرکمشر / درېیم ساتنمن",10640},{"معاون سرپرکمشر",10070},
            {"پرکمشر",9888},{"ساتونکی",9111},{"اوم بست — اول قدم",5540},{"اتم بست — اول قدم",4960}
        };

        public MainForm()
        {
            Text = "د مالي مدیریت";
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(1180,760);
            MinimumSize = new Size(980,650);
            BackColor = Bg;
            ForeColor = TextC;
            Font = new Font("Segoe UI",10F);
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;

            BuildShell();
            BuildSalary();
            BuildContact();
            BuildSettings();

            Shown += delegate {
                ShowSalary();
                LoadLocal();
                Recalculate();
            };
        }

        private void BuildShell()
        {
            Panel top = new Panel {Dock=DockStyle.Top,Height=76,BackColor=Color.FromArgb(3,13,29)};
            top.Controls.Add(new Label {
                Text="د مالي مدیریت",AutoSize=true,Font=new Font("Segoe UI",19F,FontStyle.Bold),
                ForeColor=TextC,Location=new Point(25,11)
            });
            top.Controls.Add(new Label {
                Text="آفلاین معاشاتي محاسبه • 1405 هـ.ش",AutoSize=true,Font=new Font("Segoe UI",9F),
                ForeColor=Muted,Location=new Point(29,48)
            });
            Controls.Add(top);

            Panel nav = new Panel {
                Dock=DockStyle.Right,Width=225,BackColor=Color.FromArgb(5,17,34),
                Padding=new Padding(10,16,10,10)
            };
            salaryNav = MakeNav("د معاشونو معلومات",IconKind.Wallet,Color.FromArgb(85,168,255));
            contactNav = MakeNav("زموږ سره اړیکه",IconKind.Contact,Color.FromArgb(45,216,132));
            settingsNav = MakeNav("تنظیمات",IconKind.Settings,Number);
            nav.Controls.Add(settingsNav);
            nav.Controls.Add(contactNav);
            nav.Controls.Add(salaryNav);
            Controls.Add(nav);

            content = new Panel {Dock=DockStyle.Fill,BackColor=Bg,AutoScroll=true,Padding=new Padding(18)};
            Controls.Add(content);

            top.BringToFront();
            nav.BringToFront();
        }

        private Button MakeNav(string text, IconKind kind, Color color)
        {
            IconButton b = new IconButton {
                Text=text,IconKind=kind,IconColor=color,Dock=DockStyle.Top,Height=82,
                FlatStyle=FlatStyle.Flat,Font=new Font("Segoe UI",10F,FontStyle.Bold),
                BackColor=Color.Transparent,ForeColor=Muted
            };
            b.FlatAppearance.BorderSize=0;
            b.Click += delegate {
                if (b==salaryNav) ShowSalary();
                else if (b==contactNav) ShowPanel(contactPanel,contactNav);
                else ShowPanel(settingsPanel,settingsNav);
            };
            return b;
        }

        private Panel Card()
        {
            return new Panel {
                Dock=DockStyle.Top,BackColor=Panel,Padding=new Padding(1),
                AutoSize=true,Margin=new Padding(0,0,0,12)
            };
        }

        private Label HeaderLabel(string title,string subtitle)
        {
            return new Label {
                Text=title+"\r\n"+subtitle,AutoSize=true,Dock=DockStyle.Top,
                Padding=new Padding(14),ForeColor=TextC,
                Font=new Font("Segoe UI",14F,FontStyle.Bold)
            };
        }

        private void ShowSalary() { ShowPanel(salaryPanel,salaryNav); }

        private void ShowPanel(Panel p, Button active)
        {
            content.Controls.Clear();
            p.Dock=DockStyle.Top;
            content.Controls.Add(p);
            SetNav(salaryNav,salaryNav==active);
            SetNav(contactNav,contactNav==active);
            SetNav(settingsNav,settingsNav==active);
        }

        private void SetNav(Button b,bool active)
        {
            b.BackColor=active?Color.FromArgb(20,55,88):Color.Transparent;
            b.ForeColor=active?TextC:Muted;
        }

        private TextBox MakeField(string value)
        {
            return new TextBox {
                Text=value,BackColor=Field,ForeColor=TextC,
                Height=36,Dock=DockStyle.Fill,BorderStyle=BorderStyle.FixedSingle
            };
        }

        private TextBox ReadOnlyField(string value)
        {
            TextBox t=MakeField(value);
            t.ReadOnly=true;
            t.ForeColor=Number;
            return t;
        }

        private ComboBox MakeCombo(params string[] values)
        {
            ComboBox c=new ComboBox {DropDownStyle=ComboBoxStyle.DropDownList,Dock=DockStyle.Fill,BackColor=Field,ForeColor=TextC};
            foreach(string s in values)c.Items.Add(s);
            if(c.Items.Count>0)c.SelectedIndex=0;
            return c;
        }

        private NumericUpDown MakeNum(decimal min,decimal max,decimal value)
        {
            return new NumericUpDown {
                Minimum=min,Maximum=max,Value=value,DecimalPlaces=0,
                Height=36,Dock=DockStyle.Fill,BackColor=Field,ForeColor=TextC
            };
        }

        private void AddField(TableLayoutPanel t,string label,Control c)
        {
            int row=t.RowCount++;
            t.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            t.Controls.Add(new Label {
                Text=label,AutoSize=true,ForeColor=Muted,Margin=new Padding(8,11,4,8)
            },0,row);
            t.Controls.Add(c,1,row);
        }

        private void BuildSalary()
        {
            salaryPanel=new Panel {BackColor=Bg,AutoSize=true};

            Panel formCard=Card();
            formCard.Controls.Add(HeaderLabel(
                "د معاشونو معلومات",
                "یو محاسبوي فورم • ټول حساب په دې کمپیوټر کې آفلاین"
            ));

            TableLayoutPanel form=new TableLayoutPanel {
                Dock=DockStyle.Top,AutoSize=true,ColumnCount=2,Padding=new Padding(12)
            };
            form.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,35));
            form.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,65));

            nameBox=MakeField(""); AddField(form,"۱ ـ نوم",nameBox);
            sector=MakeCombo("نظامي","ملکي"); AddField(form,"۲ ـ نظامي / ملکي",sector);
            institution=MakeCombo(
                "د ملي دفاع وزارت","د کورنیو چارو وزارت","د استخباراتو لوی ریاست",
                "نور نظامي تشکیلات لرونکی امارتي واحد","ملکي وزارت / لوی ریاست"
            ); AddField(form,"۳ ـ اړوند وزارت / لوی ریاست",institution);
            AddField(form,"۴ ـ مالي کال",ReadOnlyField("1405 هـ.ش"));
            month=MakeCombo(Months); AddField(form,"۵ ـ میاشت",month);
            startDay=MakeNum(1,31,1); AddField(form,"د محاسبې د پیل ورځ",startDay);
            calcDays=MakeNum(0,372,0); AddField(form,"د محاسبې ټولې ورځې (0=د میاشتې پاتې)",calcDays);
            rank=MakeCombo(); AddField(form,"۶ ـ بست / رتبه",rank);
            baseSalary=ReadOnlyField("0"); AddField(form,"د بست مطابق معاش",baseSalary);
            education=MakeCombo("انتخاب کړئ","لیسانس","ماستر","دوکتور"); AddField(form,"۷ ـ تحصیلي سند",education);
            educationAmount=ReadOnlyField("0"); AddField(form,"د تحصیلي سند اتومات امتیاز",educationAmount);
            professional=MakeField("0"); AddField(form,"۸ ـ فوق العاده / مسلک امتیاز",professional);
            status=MakeCombo("حاضر","رخصت","مریض","کورس کابل","غیرحاضر"); AddField(form,"۹ ـ حالت",status);
            attendanceDays=MakeNum(0,372,0); AddField(form,"د غیرحاضرۍ / استثنا ورځې",attendanceDays);
            serviceYears=MakeNum(0,60,0); AddField(form,"د خدمت موده (کلونه)",serviceYears);
            serviceAmount=ReadOnlyField("0"); AddField(form,"د خدمت مودې اتومات امتیاز",serviceAmount);
            AddField(form,"د یوې ورځې اعاشه",ReadOnlyField("150"));
            feedingTotal=ReadOnlyField("0"); AddField(form,"د ټاکل شوې مودې اعاشه",feedingTotal);

            formCard.Controls.Add(form);
            periodNote=new Label {AutoSize=true,Dock=DockStyle.Top,Padding=new Padding(12),ForeColor=Muted};
            formCard.Controls.Add(periodNote);

            Button save=new Button {
                Text="محاسبه او ثبت محلي",Dock=DockStyle.Top,Height=44,
                FlatStyle=FlatStyle.Flat,BackColor=Accent,ForeColor=Color.White
            };
            save.Click += delegate {
                SaveLocal();
                Recalculate();
                MessageBox.Show("معلومات په دې کمپیوټر کې محلي ثبت شول.","د مالي مدیریت",
                    MessageBoxButtons.OK,MessageBoxIcon.Information);
            };
            formCard.Controls.Add(save);

            salaryPanel.Controls.Add(ResultCard());
            salaryPanel.Controls.Add(TaxCard());
            salaryPanel.Controls.Add(formCard);

            PopulateRanks();

            nameBox.TextChanged+=InputChanged;
            professional.TextChanged+=InputChanged;
            sector.SelectedIndexChanged+=InputChanged;
            sector.SelectedIndexChanged+=delegate{PopulateRanks();};
            institution.SelectedIndexChanged+=InputChanged;
            month.SelectedIndexChanged+=InputChanged;
            rank.SelectedIndexChanged+=InputChanged;
            education.SelectedIndexChanged+=InputChanged;
            status.SelectedIndexChanged+=InputChanged;
            startDay.ValueChanged+=InputChanged;
            calcDays.ValueChanged+=InputChanged;
            attendanceDays.ValueChanged+=InputChanged;
            serviceYears.ValueChanged+=InputChanged;
        }

        private void InputChanged(object sender,EventArgs e)
        {
            if(loading)return;
            Recalculate();
        }

        private Panel TaxCard()
        {
            Panel c=Card();
            c.Controls.Add(HeaderLabel("د مالیې لنډه پایله","د ټاکل شوي نورم له مخې"));
            TableLayoutPanel t=new TableLayoutPanel {
                Dock=DockStyle.Top,Height=86,ColumnCount=4,Padding=new Padding(10)
            };
            t.Controls.Add(Kpi("د معاش مجموعه",out kBase));
            t.Controls.Add(Kpi("ټول امتیازات او اعاشه",out kAllow));
            t.Controls.Add(Kpi("کسرات / مالیه",out kTax));
            t.Controls.Add(Kpi("صافي پاتې رقم",out kNet));
            c.Controls.Add(t);
            return c;
        }

        private Control Kpi(string title,out Label value)
        {
            Panel p=new Panel {Dock=DockStyle.Fill,BackColor=Field,Margin=new Padding(5),Padding=new Padding(8)};
            p.Controls.Add(new Label {Text=title,AutoSize=true,ForeColor=Muted,Dock=DockStyle.Top});
            value=new Label {
                Text="0",ForeColor=Number,Dock=DockStyle.Fill,
                Font=new Font("Segoe UI",13F,FontStyle.Bold),
                TextAlign=ContentAlignment.MiddleRight
            };
            p.Controls.Add(value);
            return p;
        }

        private Panel ResultCard()
        {
            Panel c=Card();
            c.Controls.Add(HeaderLabel("محاسبوي پایله","یوه نتیجه جدول • 1405 هـ.ش"));
            grid=new DataGridView {
                Dock=DockStyle.Top,Height=210,AutoGenerateColumns=false,
                AllowUserToAddRows=false,ReadOnly=true,RowHeadersVisible=false,
                BackgroundColor=Field,BorderStyle=BorderStyle.FixedSingle,
                RightToLeft=RightToLeft.Yes,AutoSizeRowsMode=DataGridViewAutoSizeRowsMode.AllCells,
                EnableHeadersVisualStyles=false
            };
            grid.ColumnHeadersDefaultCellStyle.BackColor=Color.FromArgb(22,75,125);
            grid.ColumnHeadersDefaultCellStyle.ForeColor=Color.White;
            grid.DefaultCellStyle.BackColor=Field;
            grid.DefaultCellStyle.ForeColor=TextC;

            AddColumn("نوم","Name",125);
            AddColumn("بست / رتبه","Rank",160);
            AddColumn("بست معاش","Base",85);
            AddColumn("اعاشه","Food",78);
            AddColumn("خدمت","Service",75);
            AddColumn("تحصیل","Edu",75);
            AddColumn("فوق العاده","Prof",85);
            AddColumn("مکمل مجموعه","Gross",95);
            AddColumn("مالیه","Tax",78);
            AddColumn("بانک کسر","Bank",75);
            AddColumn("صافي","Net",90);
            AddColumn("تفصیل","Detail",180);

            c.Controls.Add(grid);
            return c;
        }

        private void AddColumn(string header,string name,int width)
        {
            grid.Columns.Add(new DataGridViewTextBoxColumn {HeaderText=header,Name=name,Width=width});
        }

        private void BuildContact()
        {
            contactPanel=Card();
            contactPanel.Controls.Add(HeaderLabel(
                "زموږ سره اړیکه",
                "اړیکې آفلاین خوندي دي؛ بهرني لینکونه د انټرنېټ له لارې خلاصیږي."
            ));
            contactPanel.Controls.Add(new Label {
                Text="حافظ محیب الله ایوب\r\nولایت: ارزګان | ولسوالۍ: چوره | قریه: خواجه خدیر\r\nتلیفون: 0705965475",
                AutoSize=true,Dock=DockStyle.Top,Padding=new Padding(14),ForeColor=TextC
            });

            AddButton(contactPanel,"تلیفون",delegate{StartUrl("tel:+93705965475");});
            AddButton(contactPanel,"WhatsApp",delegate{StartUrl("https://wa.me/93705965475");});
            AddButton(contactPanel,"YouTube",delegate{StartUrl("https://youtube.com/channel/UCgilh9KTiPaLGCsDELLNcjw?si=zypPIMpBe6sVpUIm");});
            AddButton(contactPanel,"Facebook",delegate{StartUrl("https://www.facebook.com/share/193AP34ZUS/");});
            AddButton(contactPanel,"اړیکې کاپي کول",delegate{
                try{Clipboard.SetText(ContactText());MessageBox.Show("د اړیکو معلومات کاپي شول.","د مالي مدیریت");}
                catch{MessageBox.Show("کاپي کول ممکن نه شول.","د مالي مدیریت");}
            });
            AddButton(contactPanel,"نورو ته لېږل",delegate{
                try{Clipboard.SetText(ContactText());MessageBox.Show("معلومات کاپي شول؛ اوس یې WhatsApp/Telegram/Email ته ولېږئ.","د مالي مدیریت");}
                catch{MessageBox.Show("شریکول ممکن نه شول.","د مالي مدیریت");}
            });
        }

        private string ContactText()
        {
            return "د مالي مدیریت - اړیکې\r\nحافظ محیب الله ایوب\r\nولایت: ارزګان | ولسوالۍ: چوره | قریه: خواجه خدیر\r\nتلیفون: 0705965475\r\nWhatsApp: https://wa.me/93705965475\r\nYouTube: https://youtube.com/channel/UCgilh9KTiPaLGCsDELLNcjw?si=zypPIMpBe6sVpUIm\r\nFacebook: https://www.facebook.com/share/193AP34ZUS/";
        }

        private void BuildSettings()
        {
            settingsPanel=Card();
            settingsPanel.Controls.Add(HeaderLabel(
                "تنظیمات",
                "د Windows آفلاین نسخې اساسي کنترولونه."
            ));
            AddButton(settingsPanel,"د محلي معلوماتو فولډر خلاصول",delegate{
                string d=Path.GetDirectoryName(dataPath);
                try{if(!Directory.Exists(d))Directory.CreateDirectory(d);Process.Start("explorer.exe",d);}catch{}
            });
            AddButton(settingsPanel,"محلي معلومات پاکول",delegate{
                if(MessageBox.Show("ایا محلي معلومات پاک شي؟","تصدیق",
                    MessageBoxButtons.YesNo,MessageBoxIcon.Warning)==DialogResult.Yes)
                {
                    try{if(File.Exists(dataPath))File.Delete(dataPath);}catch{}
                    LoadLocal();Recalculate();
                }
            });
            AddButton(settingsPanel,"د برنامه په اړه",delegate{
                MessageBox.Show(
                    "د مالي مدیریت\r\nآفلاین Windows نسخه\r\nهدف: Windows 7 / 8 / 10\r\nکال: 1405 هـ.ش",
                    "د مالي مدیریت",MessageBoxButtons.OK,MessageBoxIcon.Information);
            });
        }

        private void AddButton(Control parent,string text,EventHandler click)
        {
            Button b=new Button {
                Text=text,Dock=DockStyle.Top,Height=44,FlatStyle=FlatStyle.Flat,
                BackColor=Field,ForeColor=TextC,Font=new Font("Segoe UI",10F,FontStyle.Bold),
                Margin=new Padding(8)
            };
            b.FlatAppearance.BorderColor=Border;
            b.Click+=click;
            parent.Controls.Add(b);
        }

        private void PopulateRanks()
        {
            if(rank==null)return;
            string keep=rank.Text;
            rank.Items.Clear();
            string[] source=sector!=null&&sector.SelectedIndex==1?Civilian:Military;
            foreach(string x in source)rank.Items.Add(x);
            if(rank.Items.Count>0)
            {
                int i=rank.Items.IndexOf(keep);
                rank.SelectedIndex=i>=0?i:0;
            }
        }

        private int GetSalary(){return Salaries.ContainsKey(rank.Text)?Salaries[rank.Text]:0;}
        private int GetEdu()
        {
            if(education.Text=="لیسانس")return 450;
            if(education.Text=="ماستر")return 1100;
            if(education.Text=="دوکتور")return 2000;
            return 0;
        }
        private int GetService()
        {
            int y=(int)serviceYears.Value;
            if(y>=18)return 1700;if(y>=15)return 1400;if(y>=12)return 1100;
            if(y>=9)return 800;if(y>=6)return 500;if(y>=3)return 200;
            return 0;
        }
        private decimal Tax(decimal x)
        {
            if(x<=10000m)return 0m;
            if(x<=100000m)return Math.Round((x-10000m)*0.10m,0,MidpointRounding.AwayFromZero);
            return 9000m+Math.Round((x-100000m)*0.15m,0,MidpointRounding.AwayFromZero);
        }

        private void Recalculate()
        {
            if(rank==null||loading)return;
            int mi=Math.Max(0,Math.Min(11,month.SelectedIndex));
            int md=MonthLengths[mi];
            if(startDay.Value>md)startDay.Value=md;
            int first=md-(int)startDay.Value+1;
            int total=calcDays.Value>0?(int)calcDays.Value:first;
            if(total<1)total=1;

            int baseVal=GetSalary(),edu=GetEdu(),svc=GetService();
            decimal prof=0;decimal.TryParse(professional.Text,out prof);if(prof<0)prof=0;
            string st=status.Text;
            int ex=st=="حاضر"?0:Math.Min(total,(int)attendanceDays.Value);

            int remaining=total,currentMonth=mi,currentDay=(int)startDay.Value,remEx=ex;
            decimal tb=0,ts=0,te=0,tp=0,tf=0,tg=0,tt=0;
            List<string> detail=new List<string>();

            while(remaining>0 && currentMonth<12)
            {
                int mDays=MonthLengths[currentMonth];
                int take=Math.Min(remaining,mDays-currentDay+1);
                int pex=st=="حاضر"?0:Math.Min(remEx,take);
                remEx-=pex;
                int paid=st=="غیرحاضر"?Math.Max(0,take-pex):take;
                decimal ratio=(decimal)paid/mDays;
                decimal b=Math.Round(baseVal*ratio,0,MidpointRounding.AwayFromZero);
                decimal sv=Math.Round(svc*ratio,0,MidpointRounding.AwayFromZero);
                decimal ed=Math.Round(edu*ratio,0,MidpointRounding.AwayFromZero);
                decimal pr=Math.Round(prof*ratio,0,MidpointRounding.AwayFromZero);
                int foodDays=st=="حاضر"?take:Math.Max(0,take-pex);
                decimal f=foodDays*150m;
                decimal gross=b+sv+ed+pr+f;
                decimal tx=Tax(gross);

                tb+=b;ts+=sv;te+=ed;tp+=pr;tf+=f;tg+=gross;tt+=tx;
                detail.Add(Months[currentMonth]+" "+take+" ورځې");

                remaining-=take;
                currentMonth++;
                currentDay=1;
            }

            decimal net=Math.Max(0,tg-tt-150m);

            baseSalary.Text=((int)tb).ToString();
            educationAmount.Text=edu.ToString();
            serviceAmount.Text=svc.ToString();
            feedingTotal.Text=((int)tf).ToString();
            kBase.Text=((int)tb).ToString();
            kAllow.Text=((int)(ts+te+tp+tf)).ToString();
            kTax.Text=((int)tt).ToString();
            kNet.Text=((int)net).ToString();
            periodNote.Text="د محاسبې موده: "+total+" ورځې — "+string.Join("، ",detail.ToArray());

            grid.Rows.Clear();
            grid.Rows.Add(
                nameBox.Text,rank.Text,((int)tb).ToString(),((int)tf).ToString(),
                ((int)ts).ToString(),((int)te).ToString(),((int)tp).ToString(),
                ((int)tg).ToString(),((int)tt).ToString(),"150",((int)net).ToString(),
                string.Join("، ",detail.ToArray())
            );
        }

        private void SaveLocal()
        {
            try
            {
                string dir=Path.GetDirectoryName(dataPath);
                if(!Directory.Exists(dir))Directory.CreateDirectory(dir);

                string[] lines = {
                    nameBox.Text,sector.Text,institution.Text,month.SelectedIndex.ToString(),
                    startDay.Value.ToString(),calcDays.Value.ToString(),rank.Text,education.Text,
                    professional.Text,status.Text,attendanceDays.Value.ToString(),serviceYears.Value.ToString()
                };
                StringBuilder b=new StringBuilder();
                foreach(string x in lines)b.AppendLine(Convert.ToBase64String(Encoding.UTF8.GetBytes(x??"")));
                File.WriteAllText(dataPath,b.ToString(),Encoding.UTF8);
            }catch{}
        }

        private string GetSaved(string[] a,int index,string fallback)
        {
            try
            {
                if(index>=a.Length)return fallback;
                return Encoding.UTF8.GetString(Convert.FromBase64String(a[index]));
            }
            catch{return fallback;}
        }

        private void LoadLocal()
        {
            if(!File.Exists(dataPath))return;
            try
            {
                loading=true;
                string[] a=File.ReadAllLines(dataPath,Encoding.UTF8);
                nameBox.Text=GetSaved(a,0,"");
                sector.SelectedItem=GetSaved(a,1,"نظامي");
                institution.SelectedItem=GetSaved(a,2,"د ملي دفاع وزارت");

                int mi;int.TryParse(GetSaved(a,3,"0"),out mi);
                month.SelectedIndex=Math.Max(0,Math.Min(11,mi));

                decimal d;
                decimal.TryParse(GetSaved(a,4,"1"),out d);
                startDay.Value=Math.Max(startDay.Minimum,Math.Min(startDay.Maximum,d));

                decimal.TryParse(GetSaved(a,5,"0"),out d);
                calcDays.Value=Math.Max(calcDays.Minimum,Math.Min(calcDays.Maximum,d));

                PopulateRanks();
                rank.SelectedItem=GetSaved(a,6,rank.Text);
                education.SelectedItem=GetSaved(a,7,"انتخاب کړئ");
                professional.Text=GetSaved(a,8,"0");
                status.SelectedItem=GetSaved(a,9,"حاضر");

                decimal.TryParse(GetSaved(a,10,"0"),out d);
                attendanceDays.Value=Math.Max(0,Math.Min(attendanceDays.Maximum,d));

                decimal.TryParse(GetSaved(a,11,"0"),out d);
                serviceYears.Value=Math.Max(0,Math.Min(serviceYears.Maximum,d));
            }
            catch{}
            finally{loading=false;}
        }

        private string CleanUrl(string url)
        {
            return url;
        }

        private void StartUrl(string url)
        {
            try
            {
                Process.Start(CleanUrl(url));
            }
            catch
            {
                MessageBox.Show("د لینک خلاصول ممکن نه شول. که Windows د دې لینک لپاره اپ نه لري، Browser کې یې خلاص کړئ.","د مالي مدیریت");
            }
        }

        private enum IconKind { Wallet,Contact,Settings }

        private sealed class IconButton : Button
        {
            public IconKind IconKind;
            public Color IconColor=Color.White;

            protected override void OnPaint(PaintEventArgs e)
            {
                e.Graphics.SmoothingMode=SmoothingMode.AntiAlias;
                Rectangle r=new Rectangle(16,19,42,42);
                using(Pen p=new Pen(IconColor,2.4f))
                {
                    if(IconKind==IconKind.Wallet)
                    {
                        e.Graphics.DrawRoundedRectangle(p,r,8);
                        e.Graphics.DrawLine(p,r.Left,r.Top+13,r.Right,r.Top+13);
                        e.Graphics.DrawLine(p,r.Left+18,r.Top+26,r.Left+26,r.Top+26);
                    }
                    else if(IconKind==IconKind.Contact)
                    {
                        e.Graphics.DrawRoundedRectangle(p,new Rectangle(r.Left+1,r.Top+4,40,30),7);
                        e.Graphics.DrawLine(p,r.Left+9,r.Top+15,r.Right-9,r.Top+15);
                        e.Graphics.DrawLine(p,r.Left+9,r.Top+22,r.Left+24,r.Top+22);
                        e.Graphics.DrawLine(p,r.Left+8,r.Bottom,r.Left+15,r.Top+30);
                    }
                    else
                    {
                        e.Graphics.DrawEllipse(p,r.Left+9,r.Top+9,24,24);
                        for(int i=0;i<8;i++)
                        {
                            double a=i*Math.PI/4;
                            float x=r.Left+21+(float)Math.Cos(a)*18;
                            float y=r.Top+21+(float)Math.Sin(a)*18;
                            float x2=r.Left+21+(float)Math.Cos(a)*21;
                            float y2=r.Top+21+(float)Math.Sin(a)*21;
                            e.Graphics.DrawLine(p,x,y,x2,y2);
                        }
                    }
                }
                TextRenderer.DrawText(e.Graphics,Text,
                    new Rectangle(65,9,Width-75,64),ForeColor,
                    TextFormatFlags.HorizontalCenter|TextFormatFlags.VerticalCenter|TextFormatFlags.WordBreak);
            }
        }
    }

    internal static class GraphicsExt
    {
        public static void DrawRoundedRectangle(this Graphics g,Pen p,Rectangle r,int radius)
        {
            using(GraphicsPath path=new GraphicsPath())
            {
                int d=radius*2;
                path.AddArc(r.X,r.Y,d,d,180,90);
                path.AddArc(r.Right-d,r.Y,d,d,270,90);
                path.AddArc(r.Right-d,r.Bottom-d,d,d,0,90);
                path.AddArc(r.X,r.Bottom-d,d,d,90,90);
                path.CloseFigure();
                g.DrawPath(p,path);
            }
        }
    }
}
// ============================================================
// Hafz Admin Online System
// worker.js
//
// File storage API for 24-hour Stories
// Storage provider: Filebase S3-Compatible API
//
// Required Worker Variables / Secrets:
//   FILEBASE_ACCESS_KEY   -> Secret
//   FILEBASE_SECRET_KEY   -> Secret
//   FILEBASE_BUCKET       -> Variable
//   FILEBASE_ENDPOINT     -> Variable
//
// Firebase Authentication:
//   Firebase project ID is public and is used only to verify
//   Firebase Authentication ID tokens.
// ============================================================

const FILEBASE_REGION = "auto";
const FILEBASE_SERVICE = "s3";

const FIREBASE_PROJECT_ID = "hafz-admin-online-system";

const STORY_PREFIX = "stories/";

const MIN_FILE_SIZE = 1024; // 1 KB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const STORY_LIFETIME_SECONDS = 24 * 60 * 60;

// Google Firebase Auth public keys.
const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";


// ============================================================
// Worker
// ============================================================

export default {

  async fetch(request, env, ctx) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders()
        });
      }

      const url = new URL(request.url);

      // --------------------------------------------
      // Health
      // --------------------------------------------

      if (
        url.pathname === "/" &&
        request.method === "GET"
      ) {
        return json({
          success: true,
          service: "Hafz Admin Online System Stories API",
          status: "online",
          storage: "Filebase",
          storyLifetime: "24 hours",
          minFileSize: "1 KB",
          maxFileSize: "50 MB"
        });
      }


      // --------------------------------------------
      // Upload
      // --------------------------------------------

      if (
        url.pathname === "/stories/upload" &&
        request.method === "POST"
      ) {
        const user =
          await requireFirebaseUser(
            request
          );

        if (!user) {
          return json(
            {
              success: false,
              message:
                "Authentication required."
            },
            401
          );
        }

        return await uploadStory(
          request,
          env,
          user
        );
      }


      // --------------------------------------------
      // Download / Stream
      // --------------------------------------------

      if (
        url.pathname.startsWith(
          "/stories/file/"
        ) &&
        request.method === "GET"
      ) {
        const user =
          await requireFirebaseUser(
            request
          );

        if (!user) {
          return json(
            {
              success: false,
              message:
                "Authentication required."
            },
            401
          );
        }

        const encodedKey =
          url.pathname.substring(
            "/stories/file/".length
          );

        const key =
          safeDecodeURIComponent(
            encodedKey
          );

        if (!isSafeStoryKey(key)) {
          return json(
            {
              success: false,
              message:
                "Invalid story key."
            },
            400
          );
        }

        return await streamStory(
          env,
          key
        );
      }


      // --------------------------------------------
      // Delete
      // --------------------------------------------

      if (
        url.pathname.startsWith(
          "/stories/file/"
        ) &&
        request.method === "DELETE"
      ) {
        const user =
          await requireFirebaseUser(
            request
          );

        if (!user) {
          return json(
            {
              success: false,
              message:
                "Authentication required."
            },
            401
          );
        }

        const encodedKey =
          url.pathname.substring(
            "/stories/file/".length
          );

        const key =
          safeDecodeURIComponent(
            encodedKey
          );

        if (!isSafeStoryKey(key)) {
          return json(
            {
              success: false,
              message:
                "Invalid story key."
            },
            400
          );
        }

        await deleteFilebaseObject(
          env,
          key
        );

        return json({
          success: true,
          message:
            "Story media deleted successfully."
        });
      }


      // --------------------------------------------
      // Manual cleanup
      // --------------------------------------------

      if (
        url.pathname ===
          "/stories/cleanup" &&
        request.method === "POST"
      ) {
        const user =
          await requireFirebaseUser(
            request
          );

        if (!user) {
          return json(
            {
              success: false,
              message:
                "Authentication required."
            },
            401
          );
        }

        /*
         * This endpoint is deliberately not used for
         * automatic cleanup from the browser.
         * Cron handles automatic cleanup.
         */
        return await cleanupExpiredStories(
          env
        );
      }


      return json(
        {
          success: false,
          message:
            "Endpoint not found."
        },
        404
      );

    } catch (error) {

      console.error(
        "Worker Error:",
        error
      );

      return json(
        {
          success: false,
          message:
            error?.message ||
            "Internal server error."
        },
        500
      );
    }
  },


  // ==========================================================
  // Cloudflare Cron
  // ==========================================================

  async scheduled(
    controller,
    env,
    ctx
  ) {
    ctx.waitUntil(
      cleanupExpiredStories(
        env
      )
    );
  }
};


// ============================================================
// Upload Story
// ============================================================

async function uploadStory(
  request,
  env,
  user
) {
  const contentLengthHeader =
    request.headers.get(
      "content-length"
    );

  const contentLength =
    Number(
      contentLengthHeader || 0
    );

  if (
    contentLength &&
    contentLength < MIN_FILE_SIZE
  ) {
    return json(
      {
        success: false,
        message:
          "د فایل اندازه باید لږ تر لږه 1 KB وي."
      },
      400
    );
  }

  if (
    contentLength &&
    contentLength > MAX_FILE_SIZE
  ) {
    return json(
      {
        success: false,
        message:
          "د فایل اندازه باید له 50 MB څخه زیاته نه وي."
      },
      413
    );
  }


  const contentType =
    request.headers.get(
      "content-type"
    ) ||
    "application/octet-stream";


  const allowedType =
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType ===
      "application/octet-stream";


  if (!allowedType) {
    return json(
      {
        success: false,
        message:
          "دا ډول فایل د Story لپاره اجازه نه لري."
      },
      415
    );
  }


  const filenameHeader =
    request.headers.get(
      "x-story-filename"
    ) ||
    "story-file";


  const filename =
    sanitizeFilename(
      filenameHeader
    );


  const extension =
    getExtension(
      filename
    );


  const createdAt =
    Math.floor(
      Date.now() / 1000
    );


  const expiresAt =
    createdAt +
    STORY_LIFETIME_SECONDS;


  const storyId =
    crypto.randomUUID();


  /*
   * The expiration timestamp is embedded
   * in the object key.
   *
   * Example:
   *
   * stories/
   * 1786450000/
   * uid/
   * story-id-image.jpg
   */

  const key =
    `${STORY_PREFIX}` +
    `${expiresAt}/` +
    `${sanitizePathPart(user.uid)}/` +
    `${storyId}` +
    (extension
      ? `.${extension}`
      : "");


  const headers = {
    "content-type":
      contentType
  };


  if (contentLength) {
    headers[
      "content-length"
    ] =
      String(
        contentLength
      );
  }


  const response =
    await filebaseRequest(
      env,
      "PUT",
      key,
      request.body,
      headers
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    console.error(
      "Filebase Upload Error:",
      response.status,
      errorText
    );

    return json(
      {
        success: false,
        message:
          "Filebase upload ناکام شو.",
        status:
          response.status
      },
      502
    );
  }


  const workerUrl =
    new URL(
      `/stories/file/${encodeURIComponent(key)}`,
      request.url
    ).toString();


  return json({
    success: true,

    story: {
      id:
        storyId,

      uid:
        user.uid,

      filename,

      contentType,

      size:
        contentLength || null,

      key,

      mediaUrl:
        workerUrl,

      createdAt:
        new Date(
          createdAt * 1000
        ).toISOString(),

      expiresAt:
        new Date(
          expiresAt * 1000
        ).toISOString(),

      lifetime:
        STORY_LIFETIME_SECONDS
    }
  });
}


// ============================================================
// Stream Story
// ============================================================

async function streamStory(
  env,
  key
) {

  const parsed =
    parseStoryKey(
      key
    );


  if (!parsed) {
    return json(
      {
        success: false,
        message:
          "Invalid Story."
      },
      400
    );
  }


  const now =
    Math.floor(
      Date.now() / 1000
    );


  /*
   * This guarantees that an expired Story
   * cannot be served even when Cron has
   * not run yet.
   */

  if (
    parsed.expiresAt <=
    now
  ) {

    ctxSafeDelete(
      env,
      key
    );

    return json(
      {
        success: false,
        message:
          "دا Story نور فعال نه دی."
      },
      410
    );
  }


  const response =
    await filebaseRequest(
      env,
      "GET",
      key,
      null,
      {}
    );


  if (!response.ok) {

    return new Response(
      await response.body,
      {
        status:
          response.status,
        headers: {
          ...corsHeaders()
        }
      }
    );
  }


  const responseHeaders =
    new Headers();


  const copyHeaders = [
    "content-type",
    "content-length",
    "etag",
    "last-modified",
    "cache-control",
    "accept-ranges",
    "content-range"
  ];


  for (
    const headerName
    of copyHeaders
  ) {

    const value =
      response.headers.get(
        headerName
      );

    if (value) {
      responseHeaders.set(
        headerName,
        value
      );
    }
  }


  responseHeaders.set(
    "cache-control",
    "private, max-age=60"
  );


  Object.entries(
    corsHeaders()
  ).forEach(
    ([name, value]) => {
      responseHeaders.set(
        name,
        value
      );
    }
  );


  return new Response(
    response.body,
    {
      status:
        response.status,

      headers:
        responseHeaders
    }
  );
}


// ============================================================
// Automatic Cleanup
// ============================================================

async function cleanupExpiredStories(
  env
) {

  const now =
    Math.floor(
      Date.now() / 1000
    );


  let continuationToken =
    null;

  let deleted =
    0;

  let scanned =
    0;


  do {

    let query =
      `list-type=2` +
      `&prefix=${encodeURIComponent(
        STORY_PREFIX
      )}` +
      `&max-keys=1000`;


    if (
      continuationToken
    ) {

      query +=
        `&continuation-token=${encodeURIComponent(
          continuationToken
        )}`;
    }


    const response =
      await filebaseRequest(
        env,
        "GET",
        "",
        null,
        {},
        query
      );


    if (!response.ok) {

      const text =
        await response.text();

      console.error(
        "Cleanup list error:",
        response.status,
        text
      );

      return {
        success: false,
        scanned,
        deleted
      };
    }


    const xml =
      await response.text();


    const objects =
      parseListObjects(
        xml
      );


    scanned +=
      objects.length;


    for (
      const object
      of objects
    ) {

      const parsed =
        parseStoryKey(
          object.key
        );


      if (
        !parsed
      ) {
        continue;
      }


      if (
        parsed.expiresAt <=
        now
      ) {

        try {

          await deleteFilebaseObject(
            env,
            object.key
          );

          deleted++;

        } catch (
          error
        ) {

          console.error(
            "Expired Story delete failed:",
            object.key,
            error
          );
        }
      }
    }


    continuationToken =
      extractXmlValue(
        xml,
        "NextContinuationToken"
      );


    const truncated =
      extractXmlValue(
        xml,
        "IsTruncated"
      ) ===
      "true";


    if (
      !truncated
    ) {
      continuationToken =
        null;
    }

  } while (
    continuationToken
  );


  console.log(
    JSON.stringify({
      cleanup: true,
      scanned,
      deleted
    })
  );


  return {
    success: true,
    scanned,
    deleted
  };
}


// ============================================================
// Delete Filebase Object
// ============================================================

async function deleteFilebaseObject(
  env,
  key
) {

  const response =
    await filebaseRequest(
      env,
      "DELETE",
      key,
      null,
      {}
    );


  if (
    !response.ok &&
    response.status !== 404
  ) {

    const text =
      await response.text();

    throw new Error(
      `Filebase delete failed: ${response.status} ${text}`
    );
  }


  return true;
}


// ============================================================
// Filebase S3 Request — AWS Signature V4
// ============================================================

async function filebaseRequest(
  env,
  method,
  key,
  body = null,
  extraHeaders = {},
  rawQuery = ""
) {

  const endpoint =
    String(
      env.FILEBASE_ENDPOINT ||
      "https://s3.filebase.io"
    ).replace(
      /\/+$/,
      ""
    );


  const bucket =
    String(
      env.FILEBASE_BUCKET ||
      ""
    ).trim();


  const accessKey =
    String(
      env.FILEBASE_ACCESS_KEY ||
      ""
    ).trim();


  const secretKey =
    String(
      env.FILEBASE_SECRET_KEY ||
      ""
    ).trim();


  if (!accessKey) {
    throw new Error(
      "FILEBASE_ACCESS_KEY is missing."
    );
  }


  if (!secretKey) {
    throw new Error(
      "FILEBASE_SECRET_KEY is missing."
    );
  }


  if (!bucket) {
    throw new Error(
      "FILEBASE_BUCKET is missing."
    );
  }


  const pathname =
    key
      ? `/${encodeURIComponent(bucket)}/${encodeS3Key(key)}`
      : `/${encodeURIComponent(bucket)}`;


  const url =
    new URL(
      `${endpoint}${pathname}`
    );


  if (rawQuery) {

    const queryParams =
      new URLSearchParams(
        rawQuery
      );

    for (
      const [
        name,
        value
      ]
      of queryParams.entries()
    ) {

      url.searchParams.append(
        name,
        value
      );
    }
  }


  const now =
    new Date();


  const amzDate =
    toAmzDate(
      now
    );


  const dateStamp =
    amzDate.substring(
      0,
      8
    );


  const payloadHash =
    "UNSIGNED-PAYLOAD";


  const headers =
    new Headers();


  headers.set(
    "host",
    url.host
  );


  headers.set(
    "x-amz-date",
    amzDate
  );


  headers.set(
    "x-amz-content-sha256",
    payloadHash
  );


  for (
    const [
      name,
      value
    ]
    of Object.entries(
      extraHeaders
    )
  ) {

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {

      headers.set(
        name,
        String(value)
      );
    }
  }


  const sortedHeaders =
    [...headers.entries()]
      .map(
        ([name, value]) => [
          name.toLowerCase(),
          String(value)
            .trim()
            .replace(
              /\s+/g,
              " "
            )
        ]
      )
      .sort(
        (a, b) =>
          a[0].localeCompare(
            b[0]
          )
      );


  const canonicalHeaders =
    sortedHeaders
      .map(
        ([name, value]) =>
          `${name}:${value}\n`
      )
      .join("");


  const signedHeaders =
    sortedHeaders
      .map(
        ([name]) =>
          name
      )
      .join(";");


  const canonicalQueryString =
    canonicalizeQuery(
      url.searchParams
    );


  const canonicalRequest =
    [
      method.toUpperCase(),

      canonicalUri(
        url.pathname
      ),

      canonicalQueryString,

      canonicalHeaders,

      signedHeaders,

      payloadHash
    ].join("\n");


  const canonicalRequestHash =
    await sha256Hex(
      canonicalRequest
    );


  const credentialScope =
    `${dateStamp}/${FILEBASE_REGION}/${FILEBASE_SERVICE}/aws4_request`;


  const stringToSign =
    [
      "AWS4-HMAC-SHA256",

      amzDate,

      credentialScope,

      canonicalRequestHash
    ].join("\n");


  const signingKey =
    await getSignatureKey(
      secretKey,
      dateStamp,
      FILEBASE_REGION,
      FILEBASE_SERVICE
    );


  const signature =
    await hmacHex(
      signingKey,
      stringToSign
    );


  const authorization =
    `AWS4-HMAC-SHA256 ` +
    `Credential=${accessKey}/${credentialScope},` +
    `SignedHeaders=${signedHeaders},` +
    `Signature=${signature}`;


  headers.set(
    "authorization",
    authorization
  );


  return fetch(
    url.toString(),
    {
      method,
      headers,
      body:
        body || undefined
    }
  );
}


// ============================================================
// Firebase Authentication
// ============================================================

async function requireFirebaseUser(
  request
) {

  const authorization =
    request.headers.get(
      "authorization"
    );


  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }


  const token =
    authorization
      .substring(7)
      .trim();


  if (!token) {
    return null;
  }


  try {

    return await verifyFirebaseToken(
      token
    );

  } catch (
    error
  ) {

    console.error(
      "Firebase Auth verification failed:",
      error
    );

    return null;
  }
}


// ============================================================
// Firebase JWT Verification
// ============================================================

let cachedGoogleKeys = null;
let cachedGoogleKeysExpiresAt = 0;


async function verifyFirebaseToken(
  token
) {

  const parts =
    token.split(".");


  if (
    parts.length !== 3
  ) {
    throw new Error(
      "Invalid JWT."
    );
  }


  const header =
    JSON.parse(
      base64UrlDecode(
        parts[0]
      )
    );


  const payload =
    JSON.parse(
      base64UrlDecode(
        parts[1]
      )
    );


  const signature =
    base64UrlToBytes(
      parts[2]
    );


  if (
    header.alg !== "RS256"
  ) {
    throw new Error(
      "Unsupported JWT algorithm."
    );
  }


  if (
    !header.kid
  ) {
    throw new Error(
      "JWT key ID missing."
    );
  }


  const now =
    Math.floor(
      Date.now() / 1000
    );


  if (
    payload.exp &&
    now >= payload.exp
  ) {
    throw new Error(
      "Firebase ID token expired."
    );
  }


  if (
    !payload.sub
  ) {
    throw new Error(
      "Firebase UID missing."
    );
  }


  if (
    payload.aud !==
    FIREBASE_PROJECT_ID
  ) {
    throw new Error(
      "Firebase audience mismatch."
    );
  }


  if (
    payload.iss !==
    `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
  ) {
    throw new Error(
      "Firebase issuer mismatch."
    );
  }


  const keys =
    await getGooglePublicKeys();


  const jwk =
    keys[header.kid];


  if (
    !jwk
  ) {
    throw new Error(
      "Firebase signing key not found."
    );
  }


  const cryptoKey =
    await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256"
      },
      false,
      ["verify"]
    );


  const signingInput =
    new TextEncoder().encode(
      `${parts[0]}.${parts[1]}`
    );


  const verified =
    await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signature,
      signingInput
    );


  if (!verified) {
    throw new Error(
      "Invalid Firebase token signature."
    );
  }


  return {
    uid:
      payload.user_id ||
      payload.sub,

    email:
      payload.email ||
      "",

    emailVerified:
      payload.email_verified === true,

    claims:
      payload
  };
}


// ============================================================
// Google Public Keys
// ============================================================

async function getGooglePublicKeys() {

  const now =
    Date.now();


  if (
    cachedGoogleKeys &&
    now <
      cachedGoogleKeysExpiresAt
  ) {
    return cachedGoogleKeys;
  }


  const response =
    await fetch(
      GOOGLE_CERTS_URL
    );


  if (
    !response.ok
  ) {
    throw new Error(
      "Could not obtain Google public keys."
    );
  }


  const cacheControl =
    response.headers.get(
      "cache-control"
    ) ||
    "";


  const maxAgeMatch =
    cacheControl.match(
      /max-age=(\d+)/
    );


  const maxAge =
    maxAgeMatch
      ? Number(
          maxAgeMatch[1]
        )
      : 3600;


  cachedGoogleKeys =
    await response.json();


  cachedGoogleKeysExpiresAt =
    now +
    Math.max(
      60,
      maxAge
    ) *
      1000;


  return cachedGoogleKeys;
}


// ============================================================
// Story Key
// ============================================================

function parseStoryKey(
  key
) {

  const clean =
    key.startsWith(
      STORY_PREFIX
    )
      ? key.substring(
          STORY_PREFIX.length
        )
      : key;


  const parts =
    clean.split(
      "/"
    );


  if (
    parts.length !== 3
  ) {
    return null;
  }


  const expiresAt =
    Number(
      parts[0]
    );


  const uid =
    parts[1];


  const filename =
    parts[2];


  if (
    !Number.isFinite(
      expiresAt
    ) ||
    !uid ||
    !filename
  ) {
    return null;
  }


  return {
    expiresAt,
    uid,
    filename
  };
}


// ============================================================
// Helpers
// ============================================================

function isSafeStoryKey(
  key
) {

  if (
    !key ||
    !key.startsWith(
      STORY_PREFIX
    )
  ) {
    return false;
  }


  if (
    key.includes(
      ".."
    ) ||
    key.includes(
      "\\"
    )
  ) {
    return false;
  }


  return Boolean(
    parseStoryKey(
      key
    )
  );
}


function sanitizeFilename(
  name
) {

  return String(
    name || "story-file"
  )
    .normalize(
      "NFKC"
    )
    .replace(
      /[\\/:*?"<>|#%&{}$!'@+=`]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    )
    .replace(
      /^\.+/,
      ""
    )
    .substring(
      0,
      180
    ) ||
    "story-file";
}


function sanitizePathPart(
  value
) {

  return String(
    value || ""
  )
    .replace(
      /[^A-Za-z0-9_-]/g,
      "_"
    )
    .substring(
      0,
      128
    );
}


function getExtension(
  filename
) {

  const index =
    filename.lastIndexOf(
      "."
    );


  if (
    index < 0
  ) {
    return "";
  }


  return filename
    .substring(
      index + 1
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    )
    .substring(
      0,
      12
    );
}


function encodeS3Key(
  key
) {

  return key
    .split("/")
    .map(
      part =>
        encodeURIComponent(
          part
        )
    )
    .join("/");
}


function canonicalUri(
  pathname
) {

  return pathname
    .split("/")
    .map(
      part =>
        encodeURIComponent(
          decodeURIComponent(
            part
          )
        )
    )
    .join("/");
}


function canonicalizeQuery(
  params
) {

  return [
    ...params.entries()
  ]
    .map(
      ([key, value]) => [
        encodeURIComponent(key),
        encodeURIComponent(value)
      ]
    )
    .sort(
      (a, b) => {

        if (
          a[0] ===
          b[0]
        ) {
          return a[1].localeCompare(
            b[1]
          );
        }

        return a[0].localeCompare(
          b[0]
        );
      }
    )
    .map(
      ([key, value]) =>
        `${key}=${value}`
    )
    .join("&");
}


function toAmzDate(
  date
) {

  return date
    .toISOString()
    .replace(
      /[:-]|\.\d{3}/g,
      ""
    );
}


async function getSignatureKey(
  secret,
  dateStamp,
  region,
  service
) {

  const kDate =
    await hmac(
      utf8(
        `AWS4${secret}`
      ),
      dateStamp
    );


  const kRegion =
    await hmac(
      kDate,
      region
    );


  const kService =
    await hmac(
      kRegion,
      service
    );


  return await hmac(
    kService,
    "aws4_request"
  );
}


async function hmac(
  key,
  data
) {

  const cryptoKey =
    await crypto.subtle.importKey(
      "raw",
      typeof key ===
        "string"
        ? utf8(key)
        : key,
      {
        name:
          "HMAC",
        hash:
          "SHA-256"
      },
      false,
      [
        "sign"
      ]
    );


  return await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    utf8(data)
  );
}


async function hmacHex(
  key,
  data
) {

  return bytesToHex(
    new Uint8Array(
      await hmac(
        key,
        data
      )
    )
  );
}


async function sha256Hex(
  value
) {

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      utf8(value)
    );


  return bytesToHex(
    new Uint8Array(
      hash
    )
  );
}


function utf8(
  value
) {

  return new TextEncoder()
    .encode(
      String(value)
    );
}


function bytesToHex(
  bytes
) {

  return Array
    .from(
      bytes
    )
    .map(
      value =>
        value
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )
    .join("");
}


function base64UrlDecode(
  value
) {

  const bytes =
    base64UrlToBytes(
      value
    );

  return new TextDecoder()
    .decode(
      bytes
    );
}


function base64UrlToBytes(
  value
) {

  const normalized =
    value
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );


  const padded =
    normalized +
    "=".repeat(
      (
        4 -
        (
          normalized.length %
          4
        )
      ) % 4
    );


  const binary =
    atob(
      padded
    );


  return Uint8Array.from(
    binary,
    character =>
      character.charCodeAt(
        0
      )
  );
}


function safeDecodeURIComponent(
  value
) {

  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return "";
  }
}


function extractXmlValue(
  xml,
  tag
) {

  const match =
    xml.match(
      new RegExp(
        `<${tag}>([\\s\\S]*?)</${tag}>`
      )
    );


  if (
    !match
  ) {
    return null;
  }


  return decodeXml(
    match[1]
  );
}


function parseListObjects(
  xml
) {

  const blocks =
    xml.match(
      /<Contents>[\s\S]*?<\/Contents>/g
    ) ||
    [];


  return blocks
    .map(
      block => {

        const key =
          extractXmlValue(
            block,
            "Key"
          );

        if (
          !key
        ) {
          return null;
        }


        const sizeText =
          extractXmlValue(
            block,
            "Size"
          );


        const etag =
          extractXmlValue(
            block,
            "ETag"
          );


        return {
          key,
          size:
            sizeText
              ? Number(
                  sizeText
                )
              : null,
          etag
        };
      }
    )
    .filter(
      Boolean
    );
}


function decodeXml(
  value
) {

  return String(
    value || ""
  )
    .replace(
      /&amp;/g,
      "&"
    )
    .replace(
      /&lt;/g,
      "<"
    )
    .replace(
      /&gt;/g,
      ">"
    )
    .replace(
      /&quot;/g,
      '"'
    )
    .replace(
      /&#39;/g,
      "'"
    );
}


function corsHeaders() {

  return {
    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Methods":
      "GET,POST,DELETE,OPTIONS",

    "Access-Control-Allow-Headers":
      "Authorization,Content-Type,X-Story-Filename",

    "Access-Control-Max-Age":
      "86400"
  };
}


function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,

      headers: {
        "content-type":
          "application/json; charset=UTF-8",

        ...corsHeaders()
      }
    }
  );
}


function ctxSafeDelete(
  env,
  key
) {

  deleteFilebaseObject(
    env,
    key
  ).catch(
    error =>
      console.error(
        "Expired media cleanup error:",
        error
      )
  );
}
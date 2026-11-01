import crypto from "crypto";

export interface MonnifyConfig {
  apiKey: string;
  secretKey: string;
  contractCode: string;
  baseUrl: string;
  walletAccountNumber?: string;
}

const MONNIFY_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LagChow/1.0";

export function getMonnifyConfig(): MonnifyConfig {
  const apiKey = (process.env.MONNIFY_API_KEY || "").trim();
  const secretKey = (process.env.MONNIFY_SECRET_KEY || "").trim();
  const contractCode = (process.env.MONNIFY_CONTRACT_CODE || "").trim();
  const baseUrl = (process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com").trim().replace(/\/+$/, "");
  const walletAccountNumber = (process.env.MONNIFY_WALLET_ACCOUNT_NUMBER || "").trim();

  return {
    apiKey,
    secretKey,
    contractCode,
    baseUrl,
    walletAccountNumber,
  };
}

let cachedToken: {
  accessToken: string;
  expiresAt: number; // unix ms
} | null = null;

/**
 * Retrieves a valid Monnify Bearer Token, caching it in memory until near-expiry.
 */
export async function getMonnifyAccessToken(): Promise<string> {
  const config = getMonnifyConfig();
  if (!config.apiKey || !config.secretKey) {
    throw new Error("Monnify API Key and Secret Key are not configured in environment variables.");
  }

  const now = Date.now();
  // Return cached token if valid for at least 2 more minutes
  if (cachedToken && cachedToken.expiresAt > now + 120_000) {
    return cachedToken.accessToken;
  }

  const authString = Buffer.from(`${config.apiKey}:${config.secretKey}`).toString("base64");
  const res = await fetch(`${config.baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/json",
      "User-Agent": MONNIFY_USER_AGENT,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.requestSuccessful || !data.responseBody?.accessToken) {
    const errorMsg = data.responseMessage || `Monnify authentication failed (HTTP ${res.status})`;
    console.error("[Monnify Auth Error]:", data);
    throw new Error(errorMsg);
  }

  const expiresInSec = Number(data.responseBody.expiresIn) || 3600;
  cachedToken = {
    accessToken: data.responseBody.accessToken,
    expiresAt: now + expiresInSec * 1000,
  };

  return cachedToken.accessToken;
}

export interface InitializeTransactionInput {
  amountNaira: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  redirectUrl: string;
  metaData?: Record<string, any>;
  paymentMethods?: Array<"CARD" | "ACCOUNT_TRANSFER">;
}

export interface InitializeTransactionResult {
  checkoutUrl: string;
  transactionReference: string;
  paymentReference: string;
  authorizedAmountNaira: number;
}

/**
 * Initializes a transaction on Monnify and returns the checkout URL.
 */
export async function initializeMonnifyTransaction(
  input: InitializeTransactionInput
): Promise<InitializeTransactionResult> {
  const config = getMonnifyConfig();
  if (!config.contractCode) {
    throw new Error("Monnify contract code is not configured.");
  }

  const token = await getMonnifyAccessToken();

  // Cloudflare WAF on Monnify requires an HTTPS redirectUrl (rejects http://localhost)
  let safeRedirectUrl = input.redirectUrl;
  if (!safeRedirectUrl || safeRedirectUrl.startsWith("http://localhost") || safeRedirectUrl.startsWith("http://127.0.0.1")) {
    safeRedirectUrl = "https://lagchow.vercel.app/checkout/success";
  }

  const body: Record<string, any> = {
    amount: input.amountNaira,
    customerName: input.customerName || "LagChow Customer",
    customerEmail: input.customerEmail,
    paymentReference: input.paymentReference,
    paymentDescription: input.paymentDescription,
    currencyCode: "NGN",
    contractCode: config.contractCode,
    redirectUrl: safeRedirectUrl,
    paymentMethods: input.paymentMethods || ["CARD", "ACCOUNT_TRANSFER"],
  };

  if (input.metaData && Object.keys(input.metaData).length > 0) {
    body.metadata = input.metaData;
  }

  const res = await fetch(`${config.baseUrl}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": MONNIFY_USER_AGENT,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.requestSuccessful || !data.responseBody?.checkoutUrl) {
    const errorMsg = data.responseMessage || `Failed to initialize Monnify transaction (HTTP ${res.status})`;
    console.error("[Monnify Init Error]:", data);
    throw new Error(errorMsg);
  }

  return {
    checkoutUrl: data.responseBody.checkoutUrl,
    transactionReference: data.responseBody.transactionReference,
    paymentReference: data.responseBody.paymentReference || input.paymentReference,
    authorizedAmountNaira: Number(data.responseBody.authorizedAmount || input.amountNaira),
  };
}

export interface VerifyTransactionResult {
  paid: boolean;
  status: string; // "PAID", "OVERPAID", "PARTIALLY_PAID", "FAILED", "PENDING"
  paymentReference: string;
  transactionReference: string;
  amountPaidNaira: number;
  paidOn?: string;
  paymentMethod?: string;
  customerEmail?: string;
}

/**
 * Queries transaction status directly from Monnify API using payment reference.
 */
export async function verifyMonnifyTransaction(
  paymentReference: string
): Promise<VerifyTransactionResult> {
  const config = getMonnifyConfig();
  const token = await getMonnifyAccessToken();

  const url = `${config.baseUrl}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(
    paymentReference
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": MONNIFY_USER_AGENT,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.requestSuccessful || !data.responseBody) {
    const errorMsg = data.responseMessage || `Monnify verification failed (HTTP ${res.status})`;
    console.error("[Monnify Verify Error]:", data);
    return {
      paid: false,
      status: "FAILED",
      paymentReference,
      transactionReference: "",
      amountPaidNaira: 0,
    };
  }

  const rb = data.responseBody;
  const paymentStatus = String(rb.paymentStatus || "").toUpperCase();

  return {
    paid: paymentStatus === "PAID" || paymentStatus === "OVERPAID",
    status: paymentStatus,
    paymentReference: rb.paymentReference || paymentReference,
    transactionReference: rb.transactionReference || "",
    amountPaidNaira: Number(rb.amountPaid || rb.amount || 0),
    paidOn: rb.paidOn,
    paymentMethod: rb.paymentMethod,
    customerEmail: rb.customer?.email,
  };
}

/**
 * Verifies Monnify Webhook Signatures using SHA-512 HMAC or Transaction Hash.
 */
export function verifyMonnifyWebhookSignature(params: {
  rawBody?: string;
  signatureHeader?: string;
  secretKey: string;
  transactionHash?: string;
  computedHash?: string;
}): boolean {
  try {
    const { rawBody, signatureHeader, secretKey, transactionHash, computedHash } = params;

    // Method 1: Compare Header against SHA-512 HMAC of raw body
    if (signatureHeader && rawBody) {
      const hmac = crypto.createHmac("sha512", secretKey);
      hmac.update(rawBody);
      const expectedSignature = hmac.digest("hex");

      const sigBuf = Buffer.from(signatureHeader, "hex");
      const expBuf = Buffer.from(expectedSignature, "hex");

      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        return true;
      }
    }

    // Method 2: Compare transactionHash from payload with computed hash
    if (transactionHash && computedHash) {
      const hashBuf = Buffer.from(transactionHash, "hex");
      const compBuf = Buffer.from(computedHash, "hex");

      if (hashBuf.length === compBuf.length && crypto.timingSafeEqual(hashBuf, compBuf)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("[Monnify Sig Verify Error]:", err);
    return false;
  }
}

/**
 * Computes transaction hash according to Monnify webhook specifications:
 * SHA512(clientSecret + paymentReference + amountPaid + paidOn + transactionReference)
 */
export function computeMonnifyTransactionHash(params: {
  clientSecret: string;
  paymentReference: string;
  amountPaid: string | number;
  paidOn: string;
  transactionReference: string;
}): string {
  const { clientSecret, paymentReference, amountPaid, paidOn, transactionReference } = params;
  const hashString = `${clientSecret}|${paymentReference}|${amountPaid}|${paidOn}|${transactionReference}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

/**
 * Validates a Nigerian bank account number (NUBAN) via Monnify API.
 */
export async function validateMonnifyBankAccount(params: {
  accountNumber: string;
  bankCode: string;
}): Promise<{
  accountName: string;
  accountNumber: string;
  bankCode: string;
}> {
  const config = getMonnifyConfig();
  const token = await getMonnifyAccessToken();

  const url = `${config.baseUrl}/api/v1/disbursements/account/validate?accountNumber=${encodeURIComponent(
    params.accountNumber
  )}&bankCode=${encodeURIComponent(params.bankCode)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": MONNIFY_USER_AGENT,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.requestSuccessful || !data.responseBody?.accountName) {
    const msg = data.responseMessage || "Could not validate bank account with Monnify.";
    throw new Error(msg);
  }

  return {
    accountName: data.responseBody.accountName,
    accountNumber: data.responseBody.accountNumber || params.accountNumber,
    bankCode: data.responseBody.bankCode || params.bankCode,
  };
}

export interface DisburseSingleTransferInput {
  amountNaira: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
}

export interface DisburseSingleTransferResult {
  success: boolean;
  reference: string;
  status: string; // "SUCCESS", "PENDING", "FAILED"
  transactionDescription?: string;
}

/**
 * Executes a single payout to a vendor/rider bank account using Monnify's Disbursement API.
 */
export async function disburseMonnifySingleTransfer(
  input: DisburseSingleTransferInput
): Promise<DisburseSingleTransferResult> {
  const config = getMonnifyConfig();
  if (!config.walletAccountNumber) {
    throw new Error("Monnify wallet account number is not configured.");
  }

  const token = await getMonnifyAccessToken();

  const body = {
    amount: input.amountNaira,
    reference: input.reference,
    narration: input.narration,
    destinationBankCode: input.destinationBankCode,
    destinationAccountNumber: input.destinationAccountNumber,
    currency: "NGN",
    sourceAccountNumber: config.walletAccountNumber,
  };

  const res = await fetch(`${config.baseUrl}/api/v2/disbursements/single`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": MONNIFY_USER_AGENT,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.requestSuccessful) {
    const msg = data.responseMessage || `Monnify disbursement failed (HTTP ${res.status})`;
    console.error("[Monnify Disbursement Error]:", data);
    return {
      success: false,
      reference: input.reference,
      status: "FAILED",
      transactionDescription: msg,
    };
  }

  const status = String(data.responseBody?.status || "PENDING").toUpperCase();

  return {
    success: status === "SUCCESS" || status === "PENDING",
    reference: data.responseBody?.reference || input.reference,
    status,
    transactionDescription: data.responseBody?.transactionDescription,
  };
}

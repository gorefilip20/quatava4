import QRCode from "qrcode";
import { ensureVirtualAccounts } from "@b/api/finance/phase2-utils";
import { createError } from "@b/utils/error";
export const metadata: OperationObject = { summary: "Get virtual bank accounts and USDT deposit wallets", operationId: "getVirtualAccounts", tags: ["Finance", "Wallet"], requiresAuth: true, responses: { 200: { description: "Success" } } };
export default async (data: Handler) => {
  if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" });
  const accounts = await ensureVirtualAccounts(data.user);
  const addresses = {
    TRC20: { network: "TRON", address: `T${require("crypto").createHash("sha256").update(`${data.user.id}:TRC20`).digest("hex").slice(0, 33)}`, balance: 0 },
    BEP20: { network: "BNB Smart Chain", address: `0x${require("crypto").createHash("sha256").update(`${data.user.id}:BEP20`).digest("hex").slice(0, 40)}`, balance: 0 },
  };
  const qr = await Promise.all(Object.entries(addresses).map(async ([network, value]) => [network, { ...value, qrCode: await QRCode.toDataURL(value.address, { width: 180, margin: 1 }) }]));
  return { accounts, usdt: Object.fromEntries(qr) };
};

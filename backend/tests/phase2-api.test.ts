const mockModels = {
  wallet: { sequelize: { transaction: jest.fn() }, findOne: jest.fn(), create: jest.fn() },
  transaction: { create: jest.fn() },
  virtualCard: { findOne: jest.fn() },
};
const mockGetWallet = jest.fn();
const mockRecordActivity = jest.fn().mockResolvedValue(undefined);

jest.mock("@b/db", () => ({ models: mockModels }));
jest.mock("@b/api/finance/phase2-utils", () => ({ getWallet: mockGetWallet, recordActivity: mockRecordActivity }));

import buyCrypto from "@b/api/finance/buy-crypto/index.post";
import fundCard from "@b/api/card/fund.post";

function transactionMock() {
  return { LOCK: { UPDATE: "UPDATE" }, commit: jest.fn(), rollback: jest.fn() };
}
function walletMock(overrides: Record<string, unknown> = {}) {
  return { id: "wallet-usd", balance: 100, decrement: jest.fn(), increment: jest.fn(), ...overrides };
}

describe("phase-two API workflows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecordActivity.mockResolvedValue(undefined);
  });

  describe("Buy Crypto", () => {
    it("debits fiat, credits crypto, writes a ledger record, and commits", async () => {
      const tx = transactionMock();
      const source = walletMock();
      const destination = walletMock({ id: "wallet-usdt", balance: 0 });
      mockModels.wallet.sequelize.transaction.mockResolvedValue(tx);
      mockGetWallet.mockResolvedValue(source);
      mockModels.wallet.findOne.mockResolvedValue(destination);
      mockModels.transaction.create.mockResolvedValue({ id: "ledger-buy-1" });

      const result = await buyCrypto({ user: { id: "user-1" }, body: { fiatCurrency: "USD", cryptoCurrency: "USDT", fiatAmount: 25, rate: 1.25 } } as any);

      expect(source.decrement).toHaveBeenCalledWith("balance", { by: 25, transaction: tx });
      expect(destination.increment).toHaveBeenCalledWith("balance", { by: 20, transaction: tx });
      expect(mockModels.transaction.create).toHaveBeenCalledWith(expect.objectContaining({ type: "EXCHANGE_ORDER", amount: 20, walletId: "wallet-usdt" }), { transaction: tx });
      expect(tx.commit).toHaveBeenCalledTimes(1);
      expect(tx.rollback).not.toHaveBeenCalled();
      expect(result).toMatchObject({ cryptoAmount: 20, cryptoCurrency: "USDT", transactionId: "ledger-buy-1" });
    });

    it("rolls back when the fiat wallet cannot cover the purchase", async () => {
      const tx = transactionMock();
      mockModels.wallet.sequelize.transaction.mockResolvedValue(tx);
      mockGetWallet.mockResolvedValue(walletMock({ balance: 5 }));
      mockModels.wallet.findOne.mockResolvedValue(walletMock({ id: "wallet-usdt" }));

      await expect(buyCrypto({ user: { id: "user-1" }, body: { fiatCurrency: "USD", cryptoCurrency: "USDT", fiatAmount: 25, rate: 1 } } as any)).rejects.toThrow("Insufficient fiat wallet balance");
      expect(tx.rollback).toHaveBeenCalledTimes(1);
      expect(tx.commit).not.toHaveBeenCalled();
      expect(mockModels.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe("Card Funding", () => {
    it("debits the wallet, credits the card, writes a payment record, and commits", async () => {
      const tx = transactionMock();
      const wallet = walletMock();
      const card = { id: "card-1", balance: 10, status: "ACTIVE", increment: jest.fn(), decrement: jest.fn(), reload: jest.fn(), get: jest.fn(() => ({ id: "card-1", balance: 60, status: "ACTIVE" })) };
      mockModels.virtualCard.findOne.mockResolvedValue(card);
      mockModels.wallet.sequelize.transaction.mockResolvedValue(tx);
      mockGetWallet.mockResolvedValue(wallet);
      mockModels.transaction.create.mockResolvedValue({ id: "ledger-card-1" });

      const result = await fundCard({ user: { id: "user-1" }, body: { amount: 50, direction: "FUND", currency: "USD" } } as any);

      expect(wallet.decrement).toHaveBeenCalledWith("balance", { by: 50, transaction: tx });
      expect(card.increment).toHaveBeenCalledWith("balance", { by: 50, transaction: tx });
      expect(mockModels.transaction.create).toHaveBeenCalledWith(expect.objectContaining({ type: "PAYMENT", amount: 50, walletId: "wallet-usd" }), { transaction: tx });
      expect(tx.commit).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ message: "Card funded", card: { id: "card-1", balance: 60 } });
    });

    it("rolls back when the wallet has insufficient funds", async () => {
      const tx = transactionMock();
      const wallet = walletMock({ balance: 10 });
      const card = { id: "card-1", balance: 0, status: "ACTIVE", increment: jest.fn(), decrement: jest.fn(), reload: jest.fn(), get: jest.fn() };
      mockModels.virtualCard.findOne.mockResolvedValue(card);
      mockModels.wallet.sequelize.transaction.mockResolvedValue(tx);
      mockGetWallet.mockResolvedValue(wallet);

      await expect(fundCard({ user: { id: "user-1" }, body: { amount: 50, direction: "FUND", currency: "USD" } } as any)).rejects.toThrow("Insufficient wallet balance");
      expect(tx.rollback).toHaveBeenCalledTimes(1);
      expect(tx.commit).not.toHaveBeenCalled();
      expect(card.increment).not.toHaveBeenCalled();
    });
  });
});

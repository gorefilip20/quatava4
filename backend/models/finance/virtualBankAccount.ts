import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class virtualBankAccount extends Model<virtualBankAccountAttributes, virtualBankAccountCreationAttributes> implements virtualBankAccountAttributes {
  id!: string;
  userId!: string;
  currency!: "USD" | "EUR" | "GBP" | "LOCAL";
  countryCode?: string;
  accountType?: string;
  bankName?: string;
  routingNumber?: string;
  accountNumber?: string;
  iban?: string;
  bic?: string;
  sortCode?: string;
  status!: "ACTIVE" | "SUSPENDED";
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof virtualBankAccount {
    return virtualBankAccount.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        userId: { type: DataTypes.UUID, allowNull: false },
        currency: { type: DataTypes.ENUM("USD", "EUR", "GBP", "LOCAL"), allowNull: false },
        countryCode: { type: DataTypes.STRING(2), allowNull: true },
        accountType: { type: DataTypes.STRING(32), allowNull: true },
        bankName: { type: DataTypes.STRING(120), allowNull: true },
        routingNumber: { type: DataTypes.STRING(32), allowNull: true },
        accountNumber: { type: DataTypes.STRING(64), allowNull: true },
        iban: { type: DataTypes.STRING(64), allowNull: true },
        bic: { type: DataTypes.STRING(32), allowNull: true },
        sortCode: { type: DataTypes.STRING(16), allowNull: true },
        status: { type: DataTypes.ENUM("ACTIVE", "SUSPENDED"), allowNull: false, defaultValue: "ACTIVE" },
        metadata: { type: DataTypes.JSON, allowNull: true },
      },
      { sequelize, modelName: "virtualBankAccount", tableName: "virtual_bank_account", timestamps: true, indexes: [{ unique: true, fields: ["userId", "currency"] }, { fields: ["userId"] }] }
    );
  }
  public static associate(models: any) {
    virtualBankAccount.belongsTo(models.user, { as: "user", foreignKey: "userId", onDelete: "CASCADE" });
  }
}

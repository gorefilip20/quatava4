import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class savingsVault extends Model {
  id!: string;
  name!: string;
  currency!: string;
  apy!: number;
  minDeposit!: number;
  maxDeposit!: number;
  lockDays!: number;
  status!: boolean;
  totalDeposited!: number;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof savingsVault {
    return savingsVault.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "name: Name cannot be empty" },
          },
        },
        currency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "currency: Currency cannot be empty" },
          },
        },
        apy: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "apy: APY must be a number" },
            min: { args: [0], msg: "apy: APY must be non-negative" },
          },
        },
        minDeposit: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "minDeposit: Min deposit must be a number" },
            min: { args: [0], msg: "minDeposit: Min deposit must be non-negative" },
          },
        },
        maxDeposit: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "maxDeposit: Max deposit must be a number" },
            min: { args: [0], msg: "maxDeposit: Max deposit must be non-negative" },
          },
        },
        lockDays: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: { msg: "lockDays: Lock days must be an integer" },
            min: { args: [0], msg: "lockDays: Lock days must be non-negative" },
          },
        },
        status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        totalDeposited: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: "savingsVault",
        tableName: "savings_vault",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "savingsVaultStatusIdx",
            using: "BTREE",
            fields: [{ name: "status" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    savingsVault.hasMany(models.savingsDeposit, {
      as: "deposits",
      foreignKey: "vaultId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

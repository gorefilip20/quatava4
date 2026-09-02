import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class savingsDeposit extends Model {
  id!: string;
  userId!: string;
  vaultId!: string;
  amount!: number;
  earnedInterest!: number;
  status!: "ACTIVE" | "WITHDRAWN" | "MATURED";
  depositedAt!: Date;
  maturesAt!: Date;
  withdrawnAt!: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(
    sequelize: Sequelize.Sequelize
  ): typeof savingsDeposit {
    return savingsDeposit.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "userId: User ID cannot be null" },
            isUUID: { args: 4, msg: "userId: User ID must be a valid UUID" },
          },
        },
        vaultId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "vaultId: Vault ID cannot be null" },
            isUUID: { args: 4, msg: "vaultId: Vault ID must be a valid UUID" },
          },
        },
        amount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "amount: Amount must be a number" },
            min: { args: [0], msg: "amount: Amount must be positive" },
          },
        },
        earnedInterest: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM("ACTIVE", "WITHDRAWN", "MATURED"),
          allowNull: false,
          defaultValue: "ACTIVE",
          validate: {
            isIn: {
              args: [["ACTIVE", "WITHDRAWN", "MATURED"]],
              msg: "status: Status must be one of ACTIVE, WITHDRAWN, MATURED",
            },
          },
        },
        depositedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        maturesAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        withdrawnAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "savingsDeposit",
        tableName: "savings_deposit",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "savingsDepositUserIdIdx",
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
          {
            name: "savingsDepositVaultIdIdx",
            using: "BTREE",
            fields: [{ name: "vaultId" }],
          },
          {
            name: "savingsDepositStatusIdx",
            using: "BTREE",
            fields: [{ name: "status" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    savingsDeposit.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    savingsDeposit.belongsTo(models.savingsVault, {
      as: "vault",
      foreignKey: "vaultId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

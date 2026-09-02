import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface payrollDepositAttributes {
  id: string;
  userId: string;
  configId: string;
  amount: number;
  currency: string;
  fromAddress?: string;
  txHash?: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  depositedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type payrollDepositCreationAttributes = Sequelize.Optional<
  payrollDepositAttributes,
  "id" | "status" | "createdAt" | "updatedAt"
>;

export default class payrollDeposit
  extends Model<payrollDepositAttributes, payrollDepositCreationAttributes>
  implements payrollDepositAttributes
{
  id!: string;
  userId!: string;
  configId!: string;
  amount!: number;
  currency!: string;
  fromAddress?: string;
  txHash?: string;
  status!: "PENDING" | "CONFIRMED" | "FAILED";
  depositedAt!: Date;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof payrollDeposit {
    return payrollDeposit.init(
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
          comment: "ID of the user who received this deposit",
        },
        configId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "configId: Config ID cannot be null" },
            isUUID: { args: 4, msg: "configId: Config ID must be a valid UUID" },
          },
          comment: "ID of the payroll configuration this deposit belongs to",
        },
        amount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "amount: Amount must be a number" },
            min: { args: [0], msg: "amount: Amount must be positive" },
          },
          comment: "Amount of the deposit",
        },
        currency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "currency: Currency cannot be empty" },
          },
          comment: "Currency of the deposit",
        },
        fromAddress: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: "Blockchain address the deposit was sent from",
        },
        txHash: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: "Blockchain transaction hash",
        },
        status: {
          type: DataTypes.ENUM("PENDING", "CONFIRMED", "FAILED"),
          allowNull: false,
          defaultValue: "PENDING",
          validate: {
            isIn: {
              args: [["PENDING", "CONFIRMED", "FAILED"]],
              msg: "status: Must be one of PENDING, CONFIRMED, FAILED",
            },
          },
          comment: "Current status of the deposit",
        },
        depositedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: "When the deposit was made",
        },
      },
      {
        sequelize,
        modelName: "payrollDeposit",
        tableName: "payroll_deposit",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "payrollDepositUserIdKey",
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
          {
            name: "payrollDepositConfigIdKey",
            using: "BTREE",
            fields: [{ name: "configId" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    payrollDeposit.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    payrollDeposit.belongsTo(models.payrollConfig, {
      as: "config",
      foreignKey: "configId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

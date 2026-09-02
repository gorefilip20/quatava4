import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

interface payrollConfigAttributes {
  id: string;
  userId: string;
  companyName: string;
  payFrequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  depositCurrency: string;
  splitPercentage: number;
  walletAddress?: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  createdAt?: Date;
  updatedAt?: Date;
}

type payrollConfigCreationAttributes = Sequelize.Optional<
  payrollConfigAttributes,
  "id" | "depositCurrency" | "splitPercentage" | "status" | "createdAt" | "updatedAt"
>;

export default class payrollConfig
  extends Model<payrollConfigAttributes, payrollConfigCreationAttributes>
  implements payrollConfigAttributes
{
  id!: string;
  userId!: string;
  companyName!: string;
  payFrequency!: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  depositCurrency!: string;
  splitPercentage!: number;
  walletAddress?: string;
  status!: "ACTIVE" | "PAUSED" | "CANCELLED";
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof payrollConfig {
    return payrollConfig.init(
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
          comment: "ID of the user who owns this payroll config",
        },
        companyName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "companyName: Company name cannot be empty" },
          },
          comment: "Name of the employer company",
        },
        payFrequency: {
          type: DataTypes.ENUM("WEEKLY", "BIWEEKLY", "MONTHLY"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["WEEKLY", "BIWEEKLY", "MONTHLY"]],
              msg: "payFrequency: Must be one of WEEKLY, BIWEEKLY, MONTHLY",
            },
          },
          comment: "How often the user gets paid",
        },
        depositCurrency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          defaultValue: "USDT",
          validate: {
            notEmpty: { msg: "depositCurrency: Currency cannot be empty" },
          },
          comment: "Cryptocurrency to receive payroll in",
        },
        splitPercentage: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 100,
          validate: {
            isFloat: { msg: "splitPercentage: Must be a number" },
            min: { args: [1], msg: "splitPercentage: Must be at least 1" },
            max: { args: [100], msg: "splitPercentage: Must be at most 100" },
          },
          comment: "Percentage of salary to receive in crypto",
        },
        walletAddress: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: "Wallet address for receiving payroll deposits",
        },
        status: {
          type: DataTypes.ENUM("ACTIVE", "PAUSED", "CANCELLED"),
          allowNull: false,
          defaultValue: "ACTIVE",
          validate: {
            isIn: {
              args: [["ACTIVE", "PAUSED", "CANCELLED"]],
              msg: "status: Must be one of ACTIVE, PAUSED, CANCELLED",
            },
          },
          comment: "Current status of the payroll configuration",
        },
      },
      {
        sequelize,
        modelName: "payrollConfig",
        tableName: "payroll_config",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "payrollConfigUserIdKey",
            unique: true,
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    payrollConfig.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    payrollConfig.hasMany(models.payrollDeposit, {
      as: "deposits",
      foreignKey: "configId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

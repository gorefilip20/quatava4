import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class dcaPlan extends Model {
  id!: string;
  userId!: string;
  fromCurrency!: string;
  toCurrency!: string;
  amount!: number;
  frequency!: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  nextExecution!: Date;
  totalInvested!: number;
  totalReceived!: number;
  averagePrice!: number;
  status!: "ACTIVE" | "PAUSED" | "CANCELLED";
  executionCount!: number;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof dcaPlan {
    return dcaPlan.init(
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
        fromCurrency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "fromCurrency: From currency cannot be empty" },
          },
        },
        toCurrency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: { msg: "toCurrency: To currency cannot be empty" },
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
        frequency: {
          type: DataTypes.ENUM("DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]],
              msg: "frequency: Frequency must be one of DAILY, WEEKLY, BIWEEKLY, MONTHLY",
            },
          },
        },
        nextExecution: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        totalInvested: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        totalReceived: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        averagePrice: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: DataTypes.ENUM("ACTIVE", "PAUSED", "CANCELLED"),
          allowNull: false,
          defaultValue: "ACTIVE",
          validate: {
            isIn: {
              args: [["ACTIVE", "PAUSED", "CANCELLED"]],
              msg: "status: Status must be one of ACTIVE, PAUSED, CANCELLED",
            },
          },
        },
        executionCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: "dcaPlan",
        tableName: "dca_plan",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "dcaPlanUserIdIdx",
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
          {
            name: "dcaPlanStatusIdx",
            using: "BTREE",
            fields: [{ name: "status" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    dcaPlan.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    dcaPlan.hasMany(models.dcaExecution, {
      as: "executions",
      foreignKey: "planId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

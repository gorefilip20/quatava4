import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class dcaExecution extends Model {
  id!: string;
  planId!: string;
  fromAmount!: number;
  toAmount!: number;
  rate!: number;
  status!: "COMPLETED" | "FAILED";
  executedAt!: Date;
  createdAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof dcaExecution {
    return dcaExecution.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        planId: {
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            notNull: { msg: "planId: Plan ID cannot be null" },
            isUUID: { args: 4, msg: "planId: Plan ID must be a valid UUID" },
          },
        },
        fromAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "fromAmount: From amount must be a number" },
          },
        },
        toAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "toAmount: To amount must be a number" },
          },
        },
        rate: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "rate: Rate must be a number" },
          },
        },
        status: {
          type: DataTypes.ENUM("COMPLETED", "FAILED"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["COMPLETED", "FAILED"]],
              msg: "status: Status must be one of COMPLETED, FAILED",
            },
          },
        },
        executedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "dcaExecution",
        tableName: "dca_execution",
        timestamps: true,
        updatedAt: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "dcaExecutionPlanIdIdx",
            using: "BTREE",
            fields: [{ name: "planId" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    dcaExecution.belongsTo(models.dcaPlan, {
      as: "plan",
      foreignKey: "planId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

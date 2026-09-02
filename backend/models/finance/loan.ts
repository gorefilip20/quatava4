import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class loan extends Model {
  id!: string;
  userId!: string;
  collateralCurrency!: string;
  collateralAmount!: number;
  loanCurrency!: string;
  loanAmount!: number;
  interestRate!: number;
  termDays!: number;
  status!: "ACTIVE" | "REPAID" | "LIQUIDATED" | "DEFAULTED";
  ltv!: number;
  repaidAmount!: number;
  dueDate!: Date;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof loan {
    return loan.init(
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
        collateralCurrency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            notEmpty: {
              msg: "collateralCurrency: Collateral currency cannot be empty",
            },
          },
        },
        collateralAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: {
              msg: "collateralAmount: Collateral amount must be a number",
            },
            min: {
              args: [0],
              msg: "collateralAmount: Collateral amount must be positive",
            },
          },
        },
        loanCurrency: {
          type: DataTypes.STRING(255),
          allowNull: false,
          defaultValue: "USDT",
          validate: {
            notEmpty: { msg: "loanCurrency: Loan currency cannot be empty" },
          },
        },
        loanAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "loanAmount: Loan amount must be a number" },
            min: { args: [0], msg: "loanAmount: Loan amount must be positive" },
          },
        },
        interestRate: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "interestRate: Interest rate must be a number" },
            min: {
              args: [0],
              msg: "interestRate: Interest rate must be non-negative",
            },
          },
        },
        termDays: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: { msg: "termDays: Term days must be an integer" },
            min: { args: [1], msg: "termDays: Term days must be at least 1" },
          },
        },
        status: {
          type: DataTypes.ENUM("ACTIVE", "REPAID", "LIQUIDATED", "DEFAULTED"),
          allowNull: false,
          defaultValue: "ACTIVE",
          validate: {
            isIn: {
              args: [["ACTIVE", "REPAID", "LIQUIDATED", "DEFAULTED"]],
              msg: "status: Status must be one of ACTIVE, REPAID, LIQUIDATED, DEFAULTED",
            },
          },
        },
        ltv: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "ltv: LTV must be a number" },
          },
        },
        repaidAmount: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        dueDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "loan",
        tableName: "loan",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "loanUserIdIdx",
            using: "BTREE",
            fields: [{ name: "userId" }],
          },
          {
            name: "loanStatusIdx",
            using: "BTREE",
            fields: [{ name: "status" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {
    loan.belongsTo(models.user, {
      as: "user",
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

import * as Sequelize from "sequelize";
import { DataTypes, Model } from "sequelize";

export default class loanTerm extends Model {
  id!: string;
  name!: string;
  termDays!: number;
  interestRate!: number;
  maxLtv!: number;
  minCollateral!: number;
  status!: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  public static initModel(sequelize: Sequelize.Sequelize): typeof loanTerm {
    return loanTerm.init(
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
        termDays: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: { msg: "termDays: Term days must be an integer" },
            min: { args: [1], msg: "termDays: Term days must be at least 1" },
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
        maxLtv: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: { msg: "maxLtv: Max LTV must be a number" },
            min: { args: [0], msg: "maxLtv: Max LTV must be non-negative" },
            max: { args: [100], msg: "maxLtv: Max LTV cannot exceed 100" },
          },
        },
        minCollateral: {
          type: DataTypes.DOUBLE,
          allowNull: false,
          validate: {
            isFloat: {
              msg: "minCollateral: Min collateral must be a number",
            },
            min: {
              args: [0],
              msg: "minCollateral: Min collateral must be non-negative",
            },
          },
        },
        status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: "loanTerm",
        tableName: "loan_term",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "loanTermStatusIdx",
            using: "BTREE",
            fields: [{ name: "status" }],
          },
        ],
      }
    );
  }

  public static associate(models: any) {}
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const description = await queryInterface.describeTable("market_order");
    if (!description.fee) await queryInterface.addColumn("market_order", "fee", { type: Sequelize.DECIMAL(24, 8), allowNull: false, defaultValue: 0 });
  },
  async down(queryInterface) {
    const description = await queryInterface.describeTable("market_order");
    if (description.fee) await queryInterface.removeColumn("market_order", "fee");
  },
};

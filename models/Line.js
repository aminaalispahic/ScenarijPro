const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Line = sequelize.define('Line', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    lineId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    nextLineId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    scenarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true
});

module.exports = Line;
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Checkpoint = sequelize.define('Checkpoint', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    scenarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    
    timestamps: false,
    freezeTableName: true
});

module.exports = Checkpoint;
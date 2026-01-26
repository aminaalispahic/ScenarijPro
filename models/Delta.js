const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Delta = sequelize.define('Delta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    scenarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['line_update', 'char_rename']], 
        }
    },
    lineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        
    },
    nextLineId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true,
       
    },
    oldName: {
        type: DataTypes.STRING,
        allowNull: true,
       
    },
    newName: {
        type: DataTypes.STRING,
        allowNull: true,
       
    },
    timestamp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: true,
            min: 0 // Osigurava da je timestamp broj sekundi od 1970. godine
        }
    }
}, {
    timestamps: false,
    freezeTableName: true
});

module.exports = Delta;

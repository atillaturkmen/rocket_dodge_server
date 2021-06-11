const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const express = require("express");
const database = require("./initialize_database");
const game_list = ["rocket_dodge", "hold_dodge", "hold_dodge_accelerated", "touch_dodge"];
const game_name_list = {
  "rocket_dodge": "Rocket Dodge",
  "hold_dodge": "Hold Dodge",
  "hold_dodge_accelerated": "Hold Dodge (Accelerated)",
  "touch_dodge": "Touch Dodge",
};

const platform_list = {
  "pc_score": "PC Score",
  "mobile_score": "Mobile Score"
};

module.exports = {
  fs: fs,
  path: path,
  bcrypt: bcrypt,
  crypto: crypto,
  express: express,
  database: database,
  game_list: game_list,
  game_name_list: game_name_list,
  platform_list: platform_list
};
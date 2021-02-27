const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const express = require("express");
const database = require("./initialize_database");
const game_list = ["rocket_dodge", "hold_dodge", "hold_dodge_accelerated", "touch_dodge"];

module.exports = {
  fs: fs,
  path: path,
  bcrypt: bcrypt,
  crypto: crypto,
  express: express,
  database: database,
  game_list: game_list
};
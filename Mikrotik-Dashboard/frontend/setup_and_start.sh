#!/bin/bash

# Xoá node_modules và package-lock.json nếu tồn tại
rm -rf node_modules package-lock.json

# Cài đặt dependencies với chế độ legacy peer deps
npm install --legacy-peer-deps

# Bắt đầu server
npm start
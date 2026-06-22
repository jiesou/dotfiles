vim.g.mapleader = " "

local keymap = vim.keymap


-- 单行或多行移动
keymap.set("v", "J", ":m '>+1<CR>gv=gv")
keymap.set("v", "K", ":m '<-2<CR>gv=gv")

-- Ctrl + L 清除搜索高亮、刷新屏幕
keymap.set("n", "<C-L>", ":nohlsearch<CR>:match<CR>:diffupdate<CR>")

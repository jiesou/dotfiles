local opt = vim.opt

opt.number = true
opt.cursorline = true
opt.termguicolors = true
opt.showmode = false
opt.clipboard:append("unnamedplus")

-- 关闭自动换行
opt.wrap = false
-- 左右滚动一次五格
opt.sidescroll = 20

-- 搜索
opt.ignorecase = true
opt.smartcase = true

opt.tabstop = 2
opt.shiftwidth = 2
-- 展开 TAB 为空格
opt.expandtab = true
opt.smartindent = true

-- 显示空格、TAB
opt.listchars = {
    tab = "~~",
    trail = "·"
}
opt.list = true


# 萊恩 & 辛巴｜罐罐大作戰

以曾萊恩與曾辛巴為主角的瀏覽器遊戲，包含 30 關同機雙人合作解謎及單人 3D 居家自由模式。

## 操作

闖關模式支援雙人鍵盤與手機觸控；遊戲內「?」可查看完整操作。自由模式用 WASD／方向鍵移動、空白鍵跳躍、E 互動、C 切換貓咪。拖曳場景轉頭，往上拖抬頭、往下拖低頭。另一隻貓由電腦控制。

## 執行與部署

不需要安裝相依套件或後端。使用 `python3 -m http.server 8000` 後開啟 http://localhost:8000 。GitHub Pages 可選擇 main 分支的根目錄發布。所有資源使用相對路徑，可部署於專案子路徑。

## 技術

JavaScript、Canvas 2D、WebGL／GLSL、碰撞與平台物理、A* 尋路、Pointer Events、Web Audio、localStorage。進度儲存在各裝置；不同網站網域的進度不會自動互通。

## 驗證

`node tests/game.test.cjs`

`node tests/puzzles.test.cjs`

`node tests/home.test.cjs`

三組共 409 項程式檢查。另已使用離屏 GLES 檢查 3D 模型及著色器；不等同實機手機測試。

照片與家庭影片僅供建模參考，不包含在公開專案內。

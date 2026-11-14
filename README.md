# 道具箱

GitHub Pages 向けの、ブラウザだけで使える便利ツール集です。

## Windows と iPhone でのファイル共有

GitHub Pagesにはサーバー機能がないため、端末間のファイル共有にはローカルアプリの **LAN Drop** を用意しています。PCとiPhoneが同じWi-Fiにあれば、Safariからファイルを送受信できます。詳しい起動方法は [LAN Drop の説明](lan-drop/README.md) を参照してください。

## 公開方法

1. このリポジトリを GitHub に push します。
2. GitHub の **Settings → Pages** を開きます。
3. **Deploy from a branch** を選び、公開するブランチ（通常は `main`）と `/ (root)` を指定して保存します。

数分後に GitHub Pages のURLから閲覧できます。

## 追加方法

`app.js` の `tools` 配列にツール情報を加え、`setTool()` にそのツールの画面と処理を実装します。

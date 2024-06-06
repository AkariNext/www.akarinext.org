---
title: Manjaro (GNOME)で解像度が異なるディスプレイを使用する
summary: 何もしないと全部変わっちゃって大変なことに...
date: 2024-06-06
emoji: 🖥️
authors:
  - yupix
---

# Manjaro（GNOME）で解像度が違うディスプレイを使いたい！！

何故か私のPCはCPUやメモリの割に何らかの理由で性能が出ずWindowsだと非常に重くてフラストレーションが溜まってきていたため最近Manjaro（GNOME + Wayland） に変えたのですが、デフォルトだとディスプレイ毎に拡大率を変えれなかったのでそれを解決するための方法を記載しておこうと思います。


## まずはじめに

基本的に以下の記事に書いてあることをやるだけです。
GNOMEのfractional scalingを有効にすればどうにかなります。

https://medium.com/@muffwaindan/using-multiple-monitors-with-different-resolutions-on-wayland-linux-530ef23fc5eb

<small>感謝しかない...</small>


## FSを有効にする

以下のコマンドでFSを有効にできます

```bash
gsettings set org.gnome.mutter experimental-features "['scale-monitor-framebuffer']"
```

もし他の実験的な機能を使用している場合は以下のようにリストにその機能を追加しないとFS以外が無効になってしまうので気をつけてください。

```bash
[‘scale-monitor-framebuffer’,‘kms-modifiers’]
```

もしコマンドラインでの実行が嫌な場合は `dconf-editor` を使用することもできます。
少なくとも私のManjaroにはデフォルトで入っていなかったので一応インストールコマンドを記載しておきます。

```bash
# dconf-editor が無かった場合
sudo pacman -S dconf-editor

dconf-editor org/gnome/mutter/experimental-features
```

もし `dconf-editor` に渡した引数通りに設定が開けない場合は普通にパス通りに画面を押していけば設定にたどり着けます。


## 設定を開いてディスプレイの項目を開く

ディスプレイの設定を開きます

![GNOMEのディスプレイ設定](/posts/img/using-multiple-displays-with-different-resolutions-in-manjaro-gnome/gnome-display-setting.png)

次に拡大率を変更したいディスプレイを選ぶとこのような画面が出てきます

![GNOMEの詳細なディスプレイ設定](/posts/img/using-multiple-displays-with-different-resolutions-in-manjaro-gnome/gnome-display-settings-detail.png)

ここの `Scale` という項目を変更することで拡大率を変更可能です。もしここに100%,200%,300%といったものしかない場合は再起動すると出てくると思います。それでも出てこないようならFSの設定などがうまく行っていないかもしれません。

## 終わり

Server用途以外でLinuxを入れるのかなり久々で色々忘れてしまっていたのですが、最低限これで快適に作業できるようになったので満足です

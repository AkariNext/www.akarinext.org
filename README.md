# AkariNext Web

AkariNextの公式サイトです。

## 免責事項

同じディレクトリにLICENSEが配置されているファイルやフォルダはそのLICENSEによって提供される物です。

## 実行方法（開発者向け）

postgresqlが必要です

```
cp .env.example .env

# .envを編集

npm install

npm run dev
```

## 本番環境

k8s内にあるpsql-configmap.yamlのpassword等を変更したうえで apply しておく必要があります

```sh
kubectl create secret generic akarinext-web-config --from-env-file=./.env
```
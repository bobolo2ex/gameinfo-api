# gameinfo-api

## dev

```
cd gameinfo-api
pnpm install
# or use yarn/npm
# run dev
DEBUG=yys-api:* npm start
```

## deploy
以 [PM2](https://pm2.keymetrics.io/) 为例子

```
npm install pm2 -g
cd gameinfo-api
pnpm install
# run 
pm2 run bin/www
```

搭建在本机的话，直接访问： http://localhost:3000 就可以看到了。

如果提示端口占用或者冲突的话，pm2 启动的时候指定环境端口就可以了，如：

```
PORT=3002 pm2 run bin/www
```
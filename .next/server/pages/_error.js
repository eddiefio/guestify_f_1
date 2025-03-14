(()=>{var e={};e.id=820,e.ids=[820,888,660],e.modules={1323:(e,t)=>{"use strict";Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,r){return r in t?t[r]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,r)):"function"==typeof t&&"default"===r?t:void 0}}})},7909:(e,t,r)=>{"use strict";r.r(t),r.d(t,{config:()=>h,default:()=>c,getServerSideProps:()=>f,getStaticPaths:()=>p,getStaticProps:()=>d,reportWebVitals:()=>m,routeModule:()=>v,unstable_getServerProps:()=>b,unstable_getServerSideProps:()=>P,unstable_getStaticParams:()=>x,unstable_getStaticPaths:()=>y,unstable_getStaticProps:()=>g});var n=r(7093),s=r(5244),o=r(1323),i=r(2899),a=r.n(i),l=r(3414),u=r(6971);let c=(0,o.l)(u,"default"),d=(0,o.l)(u,"getStaticProps"),p=(0,o.l)(u,"getStaticPaths"),f=(0,o.l)(u,"getServerSideProps"),h=(0,o.l)(u,"config"),m=(0,o.l)(u,"reportWebVitals"),g=(0,o.l)(u,"unstable_getStaticProps"),y=(0,o.l)(u,"unstable_getStaticPaths"),x=(0,o.l)(u,"unstable_getStaticParams"),b=(0,o.l)(u,"unstable_getServerProps"),P=(0,o.l)(u,"unstable_getServerSideProps"),v=new n.PagesRouteModule({definition:{kind:s.x.PAGES,page:"/_error",pathname:"/_error",bundlePath:"",filename:""},components:{App:l.default,Document:a()},userland:u})},8473:(e,t,r)=>{"use strict";r.d(t,{H:()=>l,a:()=>u});var n=r(997),s=r(6689),o=r(1163),i=r(2732);let a=(0,s.createContext)();function l({children:e}){let[t,r]=(0,s.useState)(null),[l,u]=(0,s.useState)(null),[c,d]=(0,s.useState)(!0),[p,f]=(0,s.useState)(!1),h=(0,o.useRouter)(),m=(0,s.useCallback)(async e=>{if(!e)return console.log("fetchUserProfile: No userId provided"),null;try{return console.log("Fetching user profile for:",e),await g(e)}catch(e){return console.error("Exception in fetchUserProfile:",e),null}},[]),g=async e=>{try{let{data:t,error:r}=await i.OQ.from("profiles").select("*").eq("id",e).single();if(r)return console.error("Error fetching profile from Supabase:",r),null;return console.log("Profile fetched successfully from Supabase:",t?.id),t}catch(e){return console.error("Unexpected error fetching profile:",e),null}},y=async(e,t)=>{try{console.log("Signing in user:",e);let{data:n,error:s}=await (0,i.q4)(()=>i.OQ.auth.signInWithPassword({email:e,password:t}));if(s){if(s.message.includes("Email not confirmed"))return{user:null,error:{...s,message:"Please check your email and confirm your account before signing in."}};throw console.error("Sign in error:",s),s}return console.log("Sign in successful:",n.user?.id),n.user&&(r(n.user),m(n.user.id).then(e=>{u(e)})),{user:n.user,error:null}}catch(e){return console.error("Error in signIn function:",e),{user:null,error:e}}},x=async(e,t,r)=>{try{let{data:n,error:s}=await (0,i.q4)(()=>i.OQ.auth.signUp({email:e,password:t,options:{data:r}}));if(s)throw s;return n.user&&await (0,i.q4)(()=>i.OQ.from("profiles").insert([{id:n.user.id,...r}])),{user:n.user,error:null}}catch(e){return{user:null,error:e}}},b=async()=>{try{await i.OQ.auth.signOut(),r(null),u(null),h.push("/auth/signin")}catch(e){console.error("Error signing out:",e)}},P=async e=>{try{let{data:t,error:r}=await (0,i.q4)(()=>i.OQ.auth.resetPasswordForEmail(e,{redirectTo:`${window.location.origin}/auth/reset-password`}));if(r)throw r;return{data:t,error:null}}catch(e){return{data:null,error:e}}},v=async e=>{try{let{data:t,error:r}=await (0,i.q4)(()=>i.OQ.auth.updateUser({password:e}));if(r)throw r;return{user:t.user,error:null}}catch(e){return{user:null,error:e}}},S=async e=>{if(!t)return{profile:null,error:Error("User not authenticated")};try{let{data:r,error:n}=await (0,i.q4)(()=>i.OQ.from("profiles").update(e).eq("id",t.id));if(n)throw n;let s={...l,...e};return u(s),{profile:r,error:null}}catch(e){return{profile:null,error:e}}};return n.jsx(a.Provider,{value:{user:t,profile:l,loading:c,authInitialized:p,signIn:y,signUp:x,signOut:b,resetPassword:P,updatePassword:v,updateProfile:S,isAuthenticated:()=>!!t},children:e})}let u=()=>(0,s.useContext)(a)},5026:(e,t,r)=>{"use strict";r.d(t,{Z:()=>i,j:()=>a});var n=r(997),s=r(6689);let o=(0,s.createContext)();function i({children:e}){let[t,r]=(0,s.useState)([]),[i,a]=(0,s.useState)(null);return n.jsx(o.Provider,{value:{cart:t,propertyId:i,setPropertyId:a,addToCart:e=>{let n=t.findIndex(t=>t.productId===e.productId&&t.propertyId===e.propertyId);if(n>=0){let s=[...t];s[n].quantity+=e.quantity,r(s)}else r([...t,e]);i||a(e.propertyId)},updateCartItem:(e,n,s)=>{r(t.map(t=>t.productId===e&&t.propertyId===n?{...t,quantity:s}:t))},removeFromCart:(e,n)=>{r(t.filter(t=>!(t.productId===e&&t.propertyId===n)))},clearCart:()=>{r([])},getCartTotal:()=>t.reduce((e,t)=>e+t.price*t.quantity,0),getCartCount:()=>t.reduce((e,t)=>e+t.quantity,0)},children:e})}let a=()=>(0,s.useContext)(o)},2732:(e,t,r)=>{"use strict";r.d(t,{OQ:()=>i,q4:()=>a});var n=r(2885);let s=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://ndiqnzxplopcbcxzondp.supabase.co",o=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw",i=(0,n.createClient)(s,o,{auth:{autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,storageKey:"supabase-auth",storage:{getItem:e=>null,setItem:(e,t)=>{},removeItem:e=>{}},cookieOptions:{secure:!0,sameSite:"lax",path:"/"}},global:{headers:{"Cache-Control":"no-store, no-cache, must-revalidate"}}}),a=async(e,t=3,r=1e3)=>{let n,s=0;for(;s<t;)try{return await e()}catch(o){n=o,console.warn(`Operation failed (attempt ${s+1}/${t}):`,o);let e=r*Math.pow(2,s);await new Promise(t=>setTimeout(t,e)),s++}throw n}},6971:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return c}});let n=r(5577),s=r(997),o=n._(r(6689)),i=n._(r(7828)),a={400:"Bad Request",404:"This page could not be found",405:"Method Not Allowed",500:"Internal Server Error"};function l(e){let{res:t,err:r}=e;return{statusCode:t&&t.statusCode?t.statusCode:r?r.statusCode:404}}let u={error:{fontFamily:'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',height:"100vh",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},desc:{lineHeight:"48px"},h1:{display:"inline-block",margin:"0 20px 0 0",paddingRight:23,fontSize:24,fontWeight:500,verticalAlign:"top"},h2:{fontSize:14,fontWeight:400,lineHeight:"28px"},wrap:{display:"inline-block"}};class c extends o.default.Component{render(){let{statusCode:e,withDarkMode:t=!0}=this.props,r=this.props.title||a[e]||"An unexpected error has occurred";return(0,s.jsxs)("div",{style:u.error,children:[(0,s.jsx)(i.default,{children:(0,s.jsx)("title",{children:e?e+": "+r:"Application error: a client-side exception has occurred"})}),(0,s.jsxs)("div",{style:u.desc,children:[(0,s.jsx)("style",{dangerouslySetInnerHTML:{__html:"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}"+(t?"@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}":"")}}),e?(0,s.jsx)("h1",{className:"next-error-h1",style:u.h1,children:e}):null,(0,s.jsx)("div",{style:u.wrap,children:(0,s.jsxs)("h2",{style:u.h2,children:[this.props.title||e?r:(0,s.jsx)(s.Fragment,{children:"Application error: a client-side exception has occurred (see the browser console for more information)"}),"."]})})]})]})}}c.displayName="ErrorPage",c.getInitialProps=l,c.origGetInitialProps=l,("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},5495:(e,t)=>{"use strict";function r(e){let{ampFirst:t=!1,hybrid:r=!1,hasQuery:n=!1}=void 0===e?{}:e;return t||r&&n}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"isInAmpMode",{enumerable:!0,get:function(){return r}})},7828:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{default:function(){return m},defaultHead:function(){return d}});let n=r(5577),s=r(1271),o=r(997),i=s._(r(6689)),a=n._(r(7215)),l=r(8039),u=r(1988),c=r(5495);function d(e){void 0===e&&(e=!1);let t=[(0,o.jsx)("meta",{charSet:"utf-8"})];return e||t.push((0,o.jsx)("meta",{name:"viewport",content:"width=device-width"})),t}function p(e,t){return"string"==typeof t||"number"==typeof t?e:t.type===i.default.Fragment?e.concat(i.default.Children.toArray(t.props.children).reduce((e,t)=>"string"==typeof t||"number"==typeof t?e:e.concat(t),[])):e.concat(t)}r(1997);let f=["name","httpEquiv","charSet","itemProp"];function h(e,t){let{inAmpMode:r}=t;return e.reduce(p,[]).reverse().concat(d(r).reverse()).filter(function(){let e=new Set,t=new Set,r=new Set,n={};return s=>{let o=!0,i=!1;if(s.key&&"number"!=typeof s.key&&s.key.indexOf("$")>0){i=!0;let t=s.key.slice(s.key.indexOf("$")+1);e.has(t)?o=!1:e.add(t)}switch(s.type){case"title":case"base":t.has(s.type)?o=!1:t.add(s.type);break;case"meta":for(let e=0,t=f.length;e<t;e++){let t=f[e];if(s.props.hasOwnProperty(t)){if("charSet"===t)r.has(t)?o=!1:r.add(t);else{let e=s.props[t],r=n[t]||new Set;("name"!==t||!i)&&r.has(e)?o=!1:(r.add(e),n[t]=r)}}}}return o}}()).reverse().map((e,t)=>{let n=e.key||t;if(!r&&"link"===e.type&&e.props.href&&["https://fonts.googleapis.com/css","https://use.typekit.net/"].some(t=>e.props.href.startsWith(t))){let t={...e.props||{}};return t["data-href"]=t.href,t.href=void 0,t["data-optimized-fonts"]=!0,i.default.cloneElement(e,t)}return i.default.cloneElement(e,{key:n})})}let m=function(e){let{children:t}=e,r=(0,i.useContext)(l.AmpStateContext),n=(0,i.useContext)(u.HeadManagerContext);return(0,o.jsx)(a.default,{reduceComponentsToState:h,headManager:n,inAmpMode:(0,c.isInAmpMode)(r),children:t})};("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},7215:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return i}});let n=r(6689),s=()=>{},o=()=>{};function i(e){var t;let{headManager:r,reduceComponentsToState:i}=e;function a(){if(r&&r.mountedInstances){let t=n.Children.toArray(Array.from(r.mountedInstances).filter(Boolean));r.updateHead(i(t,e))}}return null==r||null==(t=r.mountedInstances)||t.add(e.children),a(),s(()=>{var t;return null==r||null==(t=r.mountedInstances)||t.add(e.children),()=>{var t;null==r||null==(t=r.mountedInstances)||t.delete(e.children)}}),s(()=>(r&&(r._pendingUpdate=a),()=>{r&&(r._pendingUpdate=a)})),o(()=>(r&&r._pendingUpdate&&(r._pendingUpdate(),r._pendingUpdate=null),()=>{r&&r._pendingUpdate&&(r._pendingUpdate(),r._pendingUpdate=null)})),null}},1997:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"warnOnce",{enumerable:!0,get:function(){return r}});let r=e=>{}},3414:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>u});var n=r(997);r(9605);var s=r(968),o=r.n(s),i=r(6689),a=r(8473),l=r(5026);r(4595);let u=function({Component:e,pageProps:t}){let[r,s]=(0,i.useState)(!1),u=e.getLayout||(e=>e);return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(o(),{children:[n.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),n.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap",rel:"stylesheet"})]}),n.jsx("link",{rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",crossOrigin:"anonymous",referrerPolicy:"no-referrer"}),r?n.jsx(a.H,{children:n.jsx(l.Z,{children:u(n.jsx(e,{...t}))})}):n.jsx("div",{className:"flex justify-center items-center min-h-screen",children:n.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"})})]})}},9605:()=>{},5244:(e,t)=>{"use strict";var r;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return r}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(r||(r={}))},8039:(e,t,r)=>{"use strict";e.exports=r(7093).vendored.contexts.AmpContext},2885:e=>{"use strict";e.exports=require("@supabase/supabase-js")},2785:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},968:e=>{"use strict";e.exports=require("next/head")},6689:e=>{"use strict";e.exports=require("react")},6405:e=>{"use strict";e.exports=require("react-dom")},997:e=>{"use strict";e.exports=require("react/jsx-runtime")},2048:e=>{"use strict";e.exports=require("fs")},5315:e=>{"use strict";e.exports=require("path")},6162:e=>{"use strict";e.exports=require("stream")},1568:e=>{"use strict";e.exports=require("zlib")}};var t=require("../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[429,376,301],()=>r(7909));module.exports=n})();
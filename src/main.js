import { html } from "../flexible-js/compiler.js";
import { createRoot } from "../flexible-js/flexible.js";
import { Home } from "./pages/Home.js";
import { Cart } from "./pages/Cart.js";
import { ContentUS } from "./pages/ContentUS.js";
import { Alert } from "./pages/alert-when-placed.js";

const Root = createRoot();
const { Reactive, Ref } = Root.hooks;

export const cartItems = Reactive([])

function NavBar(){
    const [ id, navLinks ] = Ref();

    return html`
    <nav class="top-nav">
        <h1 onclick="${()=>location.hash = "#/home"}" class="title">ليالي الكروشية</h1>

        <button onclick="${()=>navLinks().classList.toggle("active")}"  class="hamburger"  aria-label="قائمة التصفح">
            <span></span>
            <span></span>
            <span></span>
        </button>

        <ul ref="${id}" class="nav-links">
            <li onclick="${()=>navLinks().classList.remove('active')}" ><a href="#/home">الرئيسية</a></li>
            <li onclick="${()=>navLinks().classList.remove('active')}" ><a href="#/cart">السلة</a></li>
            <li onclick="${()=>navLinks().classList.remove('active')}" ><a href="#/ContentUS">تواصل معنا</a></li>
        </ul>
    </nav>
    `
}
Root.router(NavBar,{
    "":Home,
    "#/home":()=>Home(),
    "#/cart":()=>Cart({cartItems,Reactive,Ref,Root}),
    "#/ContentUS":()=>ContentUS({Ref,Reactive}),
    "#/order-placed":Alert
})
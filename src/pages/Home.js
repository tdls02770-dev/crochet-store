import { html } from "../../flexible-js/compiler.js";
import { cartItems } from "../main.js";

const data = [
  {
    img: "https://picsum.photos/id/101/1200/630",
    name: "1منتج",
    price: 150,
    desc: "وصف المنتج"
  },
];

function card(props) {
  return html`
    <section class="_card" style="--product-card--accent: #4e8397;">
      <div class="_thumbnail-stack">
        <img 
          src="${props.item.img}" 
          alt="${props.item.name}" 
          width="400" 
          height="210" 
          fetchpriority="high" 
        />
      </div>

      <h2 
        class="_heading | -fluid-text -trim-both" 
        style="--fluid-text--min-font-size: 16; --fluid-text--max-font-size: 24;"
      >
        ${props.item.name}
      </h2>

      <p class="_price | -trim-both">${props.item.price} ﷼</p>
      <p class="_description | -line-clamp">${props.item.desc}</p>

      <div 
        class="_button" 
        style="--purchase-button--background: #f8f1e7; --purchase-button--foreground: var(--_accent-contrast);"
      >
        <button onclick="${()=>cartItems.set([...cartItems.value(),props.item])}" class="scope purchase-button">أضف إلى السلة</button>
      </div>
    </section>
  `;
}

export function Home(props) {
  return html`
    <div class="homePage">
      <h1>
         هنا يجد عاشق الكروشية ضالتة  
      </h1>
      <h3>أعمال يدوية صنعت بكل حب</h3>
      <hr/>
      
      <div class="products-container" for="${{
        data: data,
        each: (props) => card(props)
      }}"></div>
    </div>
  `;
}

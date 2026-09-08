import { html } from "../../flexible-js/compiler";

export function Cart(props) {
    // 1. المتغيرات المحلية للخريطة وتتبع الموقع
    let map = null;
    let marker = null;
    let selectedLocation = null;

    // 2. حالات التفاعل (State / Reactive)
    const total = props.Reactive(0);
    const isPlaced = props.Reactive(false);
    const isNotPlaced = props.Reactive(true);
    const noPhoneNumber = props.Reactive(false);
    const EmptyCart = props.Reactive(false);

    const [id, input] = props.Ref();

    // 3. دوال الخريطة والمساعدة الداخليّة
    function setMarkerPosition(position) {
        selectedLocation = {
            lat: typeof position.lat === "function" ? position.lat() : position.lat,
            lng: typeof position.lng === "function" ? position.lng() : position.lng
        };

        if (!marker) {
            marker = new google.maps.Marker({
                position: selectedLocation,
                map: map,
                draggable: true,
                title: "موقع التوصيل"
            });

            marker.addListener("dragend", () => {
                const pos = marker.getPosition();
                selectedLocation = {
                    lat: pos.lat(),
                    lng: pos.lng()
                };
                console.log("New location:", selectedLocation);
            });
        } else {
            marker.setPosition(selectedLocation);
        }

        map.setCenter(selectedLocation);
        map.setZoom(16);

        console.log("Selected location:", selectedLocation);
    }

    function initMap() {
        const mapElement = document.getElementById("google-map");

        if (!mapElement || !window.google?.maps) {
            console.error("Google Maps is not loaded.");
            return;
        }

        map = new google.maps.Map(mapElement, {
            center: {
                lat: 21.5433,
                lng: 39.1728
            },
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        });

        map.addListener("click", (event) => {
            setMarkerPosition(event.latLng);
        });
    }

    function getLocation() {
        if (!navigator.geolocation) {
            alert("المتصفح لا يدعم تحديد الموقع");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                selectedLocation = location;

                if (!map) {
                    initMap();
                }

                if (!map) {
                    alert("تعذر تحميل الخريطة");
                    return;
                }

                setMarkerPosition(
                    new google.maps.LatLng(
                        location.lat,
                        location.lng
                    )
                );
            },
            (error) => {
                console.error(error);
                if (error.code === 1) {
                    alert("يرجى السماح للموقع من إعدادات المتصفح");
                } else if (error.code === 2) {
                    alert("تعذر تحديد موقعك");
                } else if (error.code === 3) {
                    alert("انتهى وقت تحديد الموقع");
                } else {
                    alert("حدث خطأ أثناء تحديد الموقع");
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    function getCartItemsToSent(array) {
        var listText = "";
        array.forEach(element => {
            listText += element.name + " \n";
        });
        return listText;
    }

    // 4. دالة حساب المجموع
    const calculateTotal = () => {
        const items = props.cartItems.value() || [];
        const sum = items.reduce(
            (acc, current) => acc + (current.price || 0),
            0
        );
        total.set(sum);
    };

    // 5. دالة إرسال الطلب
    const placeOrder = () => {
        const items = props.cartItems.value() || [];

        if (items.length === 0) {
            EmptyCart.set(true);
            return;
        }

        EmptyCart.set(false);

        if (input().value.trim() === "") {
            noPhoneNumber.set(true);
            return;
        }

        noPhoneNumber.set(false);

        if (!selectedLocation) {
            alert("يرجى تحديد موقع التوصيل أولاً");
            return;
        }

        const mapLink = `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`;

        const message = encodeURIComponent(
            `
السلام عليكم
الاسم:${input().value}
اود ان اطلب:
${getCartItemsToSent(props.cartItems.value())}
المجموع:${total.value()}
الموقع:${mapLink}
تفاصيل اضافية:
            `
        );

        const phoneNumber = "966567417053";

        isNotPlaced.set(false);
        isPlaced.set(true);

        location.hash = "#/order-placed";

        window.open(
            `https://wa.me/${phoneNumber}?text=${message}`,
            "_blank"
        );
    };

    // تنفيذ الحساب وتهيئة الخريطة عند تحميل المكون
    calculateTotal();

    setTimeout(() => {
        initMap();
    }, 100);

    // 6. إرجاع قوالب الـ HTML
    return html`
    <section>
        <div when="${isNotPlaced.show}" class="place-order-page">

            <div
                class="list-product"
                for="${{
                    data: props.cartItems.show,
                    each: (itemProps) => html`
                        <div class="products-in-your-cart">
                            <h1>${itemProps.item.name}</h1>
                            <h2>${itemProps.item.price}</h2>
                        </div>
                    `
                }}">
            </div>

            <h1 class="total">
                المجموع: ${total.show}
            </h1>

            <input
                ref="${id}"
                type="text"
                placeholder="ادخل اسمك"
            />

            <div when="${EmptyCart.show}">
                <p>السلة فارغة</p>
                <button
                    onclick="${()=>location.hash = "#/home"}"
                    class="place-order-btn">
                    العودة لتسوق
                </button>
            </div>

            <p when="${noPhoneNumber.show}">
                الاسم غير صحيح
            </p>

            <!-- الخريطة -->
            <div
                id="google-map"
                style="
                    width: 100%;
                    height: 350px;
                    margin: 20px 0;
                    border-radius: 15px;
                    overflow: hidden;
                ">
            </div>
            <p>التوصيل للمدينة المنورة فقط</p>

            <!-- إتمام الطلب -->
            <button
                onclick="${placeOrder}"
                class="place-order-btn">
                إتمام الطلب عبر الواتساب
            </button>

        </div>

        <h1
            class="alert-when-placed"
            when="${isPlaced.show}">
            تم إرسال الطلب، سنتواصل معك قريباً عبر واتساب.
        </h1>
    </section>
    `;
}
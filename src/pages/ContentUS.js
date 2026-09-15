import { html } from "../../flexible-js/compiler.js";

export function ContentUS(props) {
  const [firstId, input1] = props.Ref()// first name
  const [secId, input2] = props.Ref()// last name
  const [thirdId, input3] = props.Ref()// eamil
  const [textId, textarea] = props.Ref()// textarea
  const submit = async () => {
    const firstName = input1().value.trim();
    const lastName = input2().value.trim();
    const email = input3().value.trim();
    const message = textarea().value.trim();

    if (!firstName || !lastName || !email || !message) {
      console.log("Please fill all fields");
      return;
    }

    try {
      const res = await fetch(
        "https://formspree.io/f/xyeyzpeo",
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: email,
            message: message,
            _subject: "Feedback"
          })
        }
      );

      const data = await res.json();

      if (res.ok) {
        console.log("Message sent successfully!", data);

        // تنظيف الحقول
        input1().value = "";
        input2().value = "";
        input3().value = "";
        textarea().value = "";

      } else {
        console.error("Formspree error:", data);
      }

    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return html`
        <div
            class="contact_us_2"
        >
            <div class="responsive-container-block big-container">
                <div class="blueBG"></div>

                <div class="responsive-container-block container">

                    <div class="container-block form-wrapper">

                        <p class="text-blk contactus-head">
                            تواصل معنا
                        </p>

                        <p class="text-blk contactus-subhead">
                            يسعدنا تواصلك معنا
                        </p>

                        <div class="responsive-container-block">

                            <!-- الاسم الأول -->
                            <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                <p class="text-blk input-title">
                                    الاسم الأول
                                </p>

                                <input
                                    class="input"
                                    ref="${firstId}"
                                    type="text"
                                >
                            </div>

                            <!-- الاسم الأخير -->
                            <div class="responsive-cell-block wk-desk-6 wk-ipadp-6 wk-tab-12 wk-mobile-12">
                                <p class="text-blk input-title">
                                    الاسم الأخير
                                </p>

                                <input
                                    class="input"
                                    ref="${secId}"
                                    type="text"
                                >
                            </div>

                            <!-- الإيميل -->
                            <div class="responsive-cell-block wk-desk-6 wk-ipadp-6 wk-tab-12 wk-mobile-12">
                                <p class="text-blk input-title">
                                    الإيميل
                                </p>

                                <input
                                    class="input"
                                    ref="${thirdId}"
                                    type="email"
                                >
                            </div>

                            <!-- الرسالة -->
                            <div class="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-12 wk-ipadp-12">
                                <p class="text-blk input-title">
                                    ما الذي يدور في ذهنك؟
                                </p>

                                <textarea
                                    class="textinput"
                                    ref="${textId}"
                                    rows="6"
                                ></textarea>
                            </div>

                        </div>

                        <button
                            class="submit-btn"
                            onclick="${submit}"
                        >
                            إرسال
                        </button>

                    </div>

                </div>
            </div>
        </div>
    `;
}

const STATE_REGEX = /__Reactive\d+__/g;
const FUNC_REGEX = /__Func\d+__/g;
const ARRAY_REGEX = /__Array\d+__/g;
const OBJECT_REGEX = /__Object\d+__/g;

// instance واحد يُعاد استخدامه بدل إنشاء DOMParser جديد كل مرة
const parser = new DOMParser();

// الأحرف التي يجب تحويلها إلى HTML entities
// حتى لا يتم تفسير القيم النصية المدخلة عبر ${} كـ HTML
const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

const ESCAPE_REGEX = /[&<>"']/g;

/**
 * يحوّل أي قيمة إلى نص آمن قبل إدخالها
 * داخل HTML يتم تمريره إلى DOMParser.
 */
function escapeHTML(value) {
  return String(value).replace(
    ESCAPE_REGEX,
    (ch) => ESCAPE_MAP[ch]
  );
}

/**
 * يستخرج جميع Reactive placeholders
 */
function getDIDS(str) {
  const matches = String(str).match(STATE_REGEX);

  return matches
    ? [...new Set(matches)]
    : [];
}

/**
 * __Func0__ => 0
 */
function getFunctionPlaceholder(str) {
  const match = String(str)
    .trim()
    .match(/^__Func(\d+)__$/);

  return match
    ? Number(match[1])
    : null;
}

/**
 * __Array0__ => 0
 */
function getArrayPlaceholder(str) {
  const match = String(str)
    .trim()
    .match(/^__Array(\d+)__$/);

  return match
    ? Number(match[1])
    : null;
}

/**
 * __Object0__ => 0
 */
function getObjectPlaceholder(str) {
  const match = String(str)
    .trim()
    .match(/^__Object(\d+)__$/);

  return match
    ? Number(match[1])
    : null;
}

// اسم tag الوسيط الذي نضعه مكان compiled node
// يجب أن يحتوي "-" حتى يتعامل معه المتصفح كـ custom element
const NODE_MARKER_TAG = "flexible-node";

/**
 * يتحقق هل القيمة عبارة عن compiled node
 *
 * مثال:
 *
 * {
 *   tagName: "div",
 *   attributes: [],
 *   children: []
 * }
 */
function isCompiledNode(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.tagName === "string" &&
    Array.isArray(value.attributes) &&
    Array.isArray(value.children)
  );
}

/**
 * يتحقق هل القيمة Plain Object حقيقي.
 *
 * نقبل:
 *
 * {}
 * Object.create(null)
 *
 * ونرفض:
 *
 * Array
 * Date
 * Map
 * Set
 * DOM elements
 * compiled nodes
 */
function isPlainObject(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);

  return (
    proto === Object.prototype ||
    proto === null
  );
}

/**
 * يتحقق إن القيمة Object نريد الاحتفاظ
 * بالـ reference الخاص بها.
 */
function isAttributeObject(value) {
  return (
    isPlainObject(value) &&
    !isCompiledNode(value)
  );
}

/**
 * يحوّل Element إلى tree structure.
 *
 * مهم:
 * لا يتم clone للـ functions أو arrays أو objects.
 * يتم الاحتفاظ بنفس الـ references.
 */
function compileNode(
  el,
  functions = [],
  nodeTrees = [],
  arrays = [],
  objects = []
) {
  const tagName = el.tagName.toLowerCase();

  const textParts = [];
  const children = [];

  el.childNodes.forEach((child) => {
    // =========================
    // Text Node
    // =========================

    if (child.nodeType === 3) {
      textParts.push(child.textContent);
    }

    // =========================
    // Element Node
    // =========================

    else if (child.nodeType === 1) {
      const childTagName =
        child.tagName.toLowerCase();

      // =========================
      // Compiled Node Marker
      // =========================

      if (childTagName === NODE_MARKER_TAG) {
        const index = Number(
          child.getAttribute("data-node")
        );

        const tree = nodeTrees[index];

        if (tree) {
          children.push(tree);
        }
      }

      // =========================
      // Normal Element
      // =========================

      else {
        children.push(
          compileNode(
            child,
            functions,
            nodeTrees,
            arrays,
            objects
          )
        );
      }
    }
  });

  // join مرة واحدة
  const textContent = textParts.join("");

  // Reactive IDs الموجودة في text
  const dids = new Set(
    getDIDS(textContent)
  );

  const attributes = [];

  Array.from(el.attributes).forEach((attr) => {
    let value = attr.value;

    // =========================
    // Function
    // =========================

    const funcIndex =
      getFunctionPlaceholder(value);

    // =========================
    // Array
    // =========================

    const arrayIndex =
      funcIndex === null
        ? getArrayPlaceholder(value)
        : null;

    // =========================
    // Object
    // =========================

    const objectIndex =
      funcIndex === null &&
      arrayIndex === null
        ? getObjectPlaceholder(value)
        : null;

    // =========================
    // Function Placeholder
    // =========================

    if (funcIndex !== null) {
      value = functions[funcIndex];
    }

    // =========================
    // Array Placeholder
    // =========================

    else if (arrayIndex !== null) {
      value = arrays[arrayIndex];
    }

    // =========================
    // Object Placeholder
    // =========================

    else if (objectIndex !== null) {
      // مهم:
      // نرجع نفس الـ object reference
      // بدون clone أو serialization
      value = objects[objectIndex];
    }

    // =========================
    // Normal Attribute
    // =========================

    else {
      getDIDS(value).forEach((d) => {
        dids.add(d);
      });
    }

    attributes.push({
      name: attr.name,
      value
    });
  });

  const didsArr = [...dids];

  return didsArr.length > 0
    ? {
        dynamic: true,
        DIDS: didsArr,
        tagName,
        textContent,
        attributes,
        children
      }
    : {
        dynamic: false,
        tagName,
        textContent,
        attributes,
        children
      };
}

/**
 * يحوّل Template Literal إلى tree structure.
 *
 * الحالات المدعومة:
 *
 * Function:
 * ${callback}
 * => __Func0__
 *
 * Compiled Node:
 * ${component}
 * => <flexible-node data-node="0"></flexible-node>
 *
 * Array:
 * ${items}
 * => __Array0__
 *
 * Object:
 * ${{ data: list.show, each: fn }}
 * => __Object0__
 *
 * String / Number / Boolean:
 * يتم escape لها قبل DOMParser
 */
export function html(strings, ...values) {
  const functions = [];
  const nodeTrees = [];
  const arrays = [];
  const objects = [];

  let templateStr = "";

  strings.forEach((str, i) => {
    templateStr += str;

    if (i >= values.length) {
      return;
    }

    const value = values[i];

    // =========================
    // Function
    // =========================

    if (typeof value === "function") {
      const index = functions.length;

      functions.push(value);

      templateStr += `__Func${index}__`;
    }

    // =========================
    // Compiled Node
    // =========================

    else if (isCompiledNode(value)) {
      const index = nodeTrees.length;

      nodeTrees.push(value);

      templateStr +=
        `<${NODE_MARKER_TAG} data-node="${index}"></${NODE_MARKER_TAG}>`;
    }

    // =========================
    // Array
    // =========================

    else if (Array.isArray(value)) {
      const index = arrays.length;

      arrays.push(value);

      templateStr += `__Array${index}__`;
    }

    // =========================
    // Object
    // =========================

    else if (isAttributeObject(value)) {
      const index = objects.length;

      objects.push(value);

      templateStr += `__Object${index}__`;
    }

    // =========================
    // Primitive
    // =========================

    else {
      templateStr += escapeHTML(value);
    }
  });

  return compiler(
    templateStr,
    functions,
    undefined,
    nodeTrees,
    arrays,
    objects
  );
}

/**
 * يحوّل HTML string إلى tree structure.
 */
export function compiler(
  templateStr,
  functions = [],
  doc,
  nodeTrees = [],
  arrays = [],
  objects = []
) {
  const parsedDoc =
    doc ||
    parser.parseFromString(
      templateStr,
      "text/html"
    );

  const root =
    parsedDoc.body.firstElementChild;

  if (!root) {
    return null;
  }

  return compileNode(
    root,
    functions,
    nodeTrees,
    arrays,
    objects
  );
}
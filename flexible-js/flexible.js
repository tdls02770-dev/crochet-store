export function createRoot() {
    var reactiveIndex = 0;
    var refIndex = 0;

    const scope = {
        relationships:{},
        reactives:{},
        refs:{},
        events:[],
        ConditionalBindings:{}
    };

    return {
        scope,
        devTools: () => {
            console.group("🛠️ Dev Tools");

            console.group("⚡ Reactives");
            console.table(scope.reactives);
            console.groupEnd();

            console.group("🔗 Refs");
            console.table(scope.refs);
            console.groupEnd();

            console.group("🔄 Relationships");

            Object.entries(scope.relationships).forEach(([key, value]) => {
                console.group(key);

                value.forEach(obj => {
                    console.log(obj.element);
                });

                console.groupEnd();
            });

            console.groupEnd();

            console.group("🎯 Events");
            console.table(scope.events);
            console.groupEnd();

            console.groupEnd();
        },
        render: (template, container) => {
            const app = build(template, scope);
            container.appendChild(app.element);
            initConditionals(scope);
        },
        router: (constantPart, routes = {}) => {
            const container = document.getElementById("app");

            const outlet = document.createElement("div");

            const constant = build(constantPart(), scope);

            container.appendChild(constant.element);
            container.appendChild(outlet);

            function handle_route() {
                cleanup(scope,outlet);

                const hash = window.location.hash;

                outlet.replaceChildren(
                    build(routes[hash](), scope).element
                );

                initConditionals(scope);
            }

            handle_route();

            window.addEventListener("hashchange", handle_route);
        },
        hooks: {
            Reactive: (initalValue) => {
                reactiveIndex++;
                const dynamicID = `__Reactive${reactiveIndex}__`;
                scope.reactives[dynamicID] = initalValue;
                scope.relationships[dynamicID] = [];

                function set(n) {
                    scope.reactives[dynamicID] = n;
                    update(dynamicID, scope);
                    if (scope.ConditionalBindings[dynamicID]) {
                        reRender(dynamicID, scope);
                    }
                }

                return { show: dynamicID, value: () => scope.reactives[dynamicID] , set}
            },
            Ref: () => {
                refIndex++;
                const RefId = `__Ref${refIndex}__`;
                function use() {
                    return scope.refs[RefId];
                }
                return [RefId, use];
            },
        },
    };
}
function cleanup(scope, outletContainer) {
    scope.relationships = {};

    // تصفية الأحداث: إزالة الأحداث الخاصة بالعناصر الموجودة داخل outlet فقط
    scope.events = scope.events.filter(event => {
        if (outletContainer.contains(event.element)) {
            event.element.removeEventListener(
                event.eventName,
                event.eventValue
            );
            return false; // حذف الحدث من القائمة
        }
        return true; // الاحتفاظ بأحداث الـ Navbar
    });
}

function resolve(value, dids, scope) {
    if (typeof value !== "string" || !Array.isArray(dids)) {
        return value;
    }

    return dids.reduce((result, did) => {
        if (Object.prototype.hasOwnProperty.call(scope.reactives, did)) {
            return result.replaceAll(
                did,
                String(scope.reactives[did] ?? "")
            );
        }
        return result;
    }, value);
}

function build(tree, scope) {
    const MainScope = scope;
    var tag = resolve(tree.tagName, tree.DIDS, MainScope);
    var text = resolve(tree.textContent, tree.DIDS, MainScope);
    const element = document.createElement(tag);
    var dynamicNode = element;

    if (tree.textContent && tree.children.length > 0) {
        dynamicNode = document.createTextNode(text);
        element.appendChild(dynamicNode);
    } else {
        element.textContent = text;
    }

    // ---------Attributes--------------------
    tree.attributes.forEach(attribute => {
        if (attribute.name.startsWith("on")) {
            var eventName = attribute.name.slice(2);
            element.addEventListener(eventName, attribute.value);
            scope.events.push({
                element, eventName, eventValue: attribute.value
            });
        } else if (attribute.name === "ref") {
            scope.refs[attribute.value] = element;
        } else if (attribute.name === "when") {
            const conditionId = attribute.value;
            if (!scope.ConditionalBindings[conditionId]) {
                scope.ConditionalBindings[conditionId] = [];
            }

            const placeholder = document.createComment(`conditional:${conditionId}`);

            scope.ConditionalBindings[conditionId].push({
                tree,
                element,
                placeholder
            });
        } else if(attribute.name === "for"){
            var data;
            if(typeof attribute.value.data === "string"){
                data = scope.reactives[attribute.value.data];
            }else{
                data = attribute.value.data
            }
            data.forEach((item,index)=>{
                const listItem = build(attribute.value.each({item,index}),scope)
                element.appendChild(listItem.element)
            })
        }else if(attribute.name === "bind"){
            return;
        }else {
            element.setAttribute(attribute.name, resolve(attribute.value, tree.DIDS, MainScope));
        }
    });

    // -----------Children-------------
    tree.children.forEach(child => {
        const childNode = build(child, MainScope);
        element.appendChild(childNode.element);
    });

    // --------Sign In Dynamic Node--------
    if (tree.dynamic) {
        tree.DIDS.forEach(dynamicID => {
            MainScope.relationships[dynamicID].push({ tree, element: dynamicNode });
        });
    }
    // --------Sign In Dynamic Node--------
    const SignIn = ()=>{
        if (tree.dynamic) {
            tree.DIDS.forEach(dynamicID => {
                MainScope.relationships[dynamicID].push({ tree, element: dynamicNode });
            });
        }
    }

    return {element,SignIn};
}


function initConditionals(scope) {
    Object.keys(scope.ConditionalBindings).forEach(dynamicID => {
        const isVisible = Boolean(scope.reactives[dynamicID]);
        if (!isVisible) {
            scope.ConditionalBindings[dynamicID].forEach(binding => {
                if (binding.element.parentNode) {
                    binding.element.parentNode.replaceChild(binding.placeholder, binding.element);
                }
            });
        }
    });
}

export function update(relationship, scope) {
    if (!scope.relationships[relationship]) return;

    scope.relationships[relationship].forEach(relation => {
        if (relation.element.nodeName === '#text') {
            if (relation.element.textContent !== resolve(relation.tree.textContent, relation.tree.DIDS, scope)) {
                relation.element.textContent = resolve(relation.tree.textContent, relation.tree.DIDS, scope);
            }
            return;
        }

        var tree = relation.tree;
        var dids = tree.DIDS;
        var element = relation.element;
        var tagName = resolve(tree.tagName, dids, scope);

        if (element.tagName && element.tagName.toLowerCase() !== tagName.toLowerCase()) {
            var newElement = document.createElement(tagName);

            Array.from(element.attributes).forEach(attr => {
                newElement.setAttribute(attr.name, attr.value);
            });

            while (element.firstChild) {
                newElement.appendChild(element.firstChild);
            }

            element.replaceWith(newElement);
            relation.element = newElement;
            element = newElement;
        }

        var textContent = resolve(tree.textContent, dids, scope);
        if (element.textContent !== textContent) {
            element.textContent = textContent;
        }

        var attributes = tree.attributes || [];
        var attributeNames = new Set();

        attributes.forEach(attribute => {
            var name = resolve(attribute.name, dids, scope);
            var value = resolve(attribute.value, dids, scope);

            attributeNames.add(name);
            if (attribute.name.startsWith("on") || attribute.name === "ref" || attribute.name === "when" || attribute.name === "bind") {
                return;
            }else if(attribute.name === "for"){
                element.innerHTML = ""
                var data;
                if(typeof attribute.value.data === "string"){
                    data = scope.reactives[attribute.value.data];
                }else{
                    data = attribute.value.data
                }
                
                data.forEach((item,index)=>{
                    const listItem = build(attribute.value.each({item,index}),scope);
                    element.appendChild(listItem.element)
                })
            }else if (element.getAttribute(name) !== value) {
                element.setAttribute(name, value);
            }
        });

        if (element.attributes) {
            Array.from(element.attributes).forEach(attribute => {
                if (!attributeNames.has(attribute.name)) {
                    element.removeAttribute(attribute.name);
                }
            });
        }
    });
}

export function reRender(dynamicID, scope) {
    const bindings = scope.ConditionalBindings[dynamicID];
    if (!bindings) return;

    const conditionValue = Boolean(scope.reactives[dynamicID]);

    bindings.forEach(binding => {
        const { placeholder, element } = binding;

        if (conditionValue) {
            if (placeholder.parentNode) {
                placeholder.parentNode.replaceChild(element, placeholder);
            }
        } else {
            if (element.parentNode) {
                element.parentNode.replaceChild(placeholder, element);
            }
        }
    });
}
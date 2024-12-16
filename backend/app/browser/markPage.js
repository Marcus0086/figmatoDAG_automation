const customCSS = `
    ::-webkit-scrollbar {
        width: 10px;
    }
    ::-webkit-scrollbar-track {
        background: #27272a;
    }
    ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 0.375rem;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

const styleTag = document.createElement("style");
styleTag.textContent = customCSS;
document.head.append(styleTag);

let labels = [];

// Function to unmark the page
function unmarkPage() {
  for (const label of labels) {
    document.body.removeChild(label);
  }
  labels = [];
}

// Function to check if an element is visible
function isVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Enhanced function to extract unique selectors
function getUniqueSelector(element) {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }
  if (element === document.body) {
    return "body";
  }

  let path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (element.parentNode && element.parentNode.childElementCount > 1) {
      let index = Array.from(element.parentNode.children).indexOf(element) + 1;
      selector += `:nth-child(${index})`;
    }
    path.unshift(selector);
    element = element.parentElement;
  }

  return path.join(" > ");
}
// ... existing code ...

// Function to get text content from pseudo-elements
function getPseudoElementContent(element, pseudo) {
  const style = window.getComputedStyle(element, pseudo);
  const content = style.getPropertyValue("content");
  // Remove quotes around the content if present
  return content && content !== "none" ? content.replace(/['"]/g, "") : "";
}

// Function to mark the page with visible and clickable elements
function markPage() {
  unmarkPage();

  let items = Array.from(document.querySelectorAll("*"))
    .map((element) => {
      const vw = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
      const vh = Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      );

      function getElementText(el, depth = 0) {
        if (depth > 5) { // Example depth limit
          return "";
        }

        let text = el.textContent.trim().replace(/\s{2,}/g, " ");
        let ariaLabel = el.getAttribute("aria-label") || "";
        let placeholder = el.getAttribute("placeholder") || "";
        let value = el.value || "";
        let title = el.getAttribute("title") || "";

        // Get content from pseudo-elements
        const beforeContent = getPseudoElementContent(el, "::before");
        const afterContent = getPseudoElementContent(el, "::after");

        // Combine all possible text sources
        const combinedText = [
          beforeContent,
          text,
          afterContent,
          ariaLabel,
          placeholder,
          value,
          title,
        ]
          .filter(Boolean)
          .join(" ");

        // Enhanced SVG and span detection
        if (
          el.tagName.toLowerCase() === "svg" ||
          el.tagName.toLowerCase() === "span" ||
          el.tagName.toLowerCase() === "path" ||
          el.querySelector("svg")
        ) {
          const possibleName = ariaLabel || title || el.getAttribute("name");
          const parentText =
            el.parentElement?.getAttribute("aria-label") ||
            el.parentElement?.title ||
            el.parentElement?.parentElement?.getAttribute("aria-label");
          const elementText = combinedText || parentText || possibleName;

          if (elementText) {
            return `${elementText}${
              el.tagName.toLowerCase() === "svg" ? " icon" : ""
            }`;
          }

          const closestElement = el.closest("button, a, nav, header, footer");
          const context = closestElement
            ? getElementText(closestElement, depth + 1)
            : "Interactive";

          return `${context}${
            el.tagName.toLowerCase() === "svg" ? " icon" : " element"
          }`;
        }

        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          return (
            placeholder ||
            value ||
            ariaLabel ||
            title ||
            combinedText ||
            el.name ||
            el.type
          );
        }
        if (el.tagName === "BUTTON") {
          return combinedText || ariaLabel || title || el.value || el.name;
        }
        if (el.tagName === "SELECT") {
          let selectedOption = el.options[el.selectedIndex];
          return selectedOption
            ? selectedOption.text
            : placeholder || ariaLabel || title || el.name;
        }
        return combinedText || ariaLabel || title;
      }

      const rects = [...element.getClientRects()]
        .filter((bb) => {
          const centerX = bb.left + bb.width / 2;
          const centerY = bb.top + bb.height / 2;
          const elAtCenter = document.elementFromPoint(centerX, centerY);

          return elAtCenter === element || element.contains(elAtCenter);
        })
        .map((bb) => {
          const rect = {
            left: Math.max(0, bb.left),
            top: Math.max(0, bb.top),
            right: Math.min(vw, bb.right),
            bottom: Math.min(vh, bb.bottom),
          };
          return {
            ...rect,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
          };
        });

      const area = rects.reduce(
        (acc, rect) => acc + rect.width * rect.height,
        0
      );
      const textualContent = getElementText(element, 0);

      return {
        element: element,
        include:
          isVisible(element) &&
          element.tagName !== "HTML" && // Exclude HTML
          element.tagName !== "BODY" &&
          (element.tagName === "INPUT" ||
            element.tagName === "TEXTAREA" ||
            element.tagName === "SELECT" ||
            element.tagName === "BUTTON" ||
            element.tagName === "A" ||
            element.tagName === "INPUT" ||
            element.onclick != null ||
            window.getComputedStyle(element).cursor === "pointer" ||
            window.getComputedStyle(element).cursor === "text" ||
            element.tagName === "IFRAME" ||
            element.tagName === "VIDEO") &&
          (textualContent.length > 0 ||
            element.getAttribute("aria-label") ||
            element.getAttribute("placeholder") ||
            element.value ||
            element.type !== "hidden"),
        area,
        rects,
        text: textualContent,
        type: element.tagName.toLowerCase(),
        selector: getUniqueSelector(element),
      };
    })
    .filter((item) => item.include && item.area >= 20);

  items = items.filter(
    (x) => !items.some((y) => x.element.contains(y.element) && x !== y)
  );

  // Generate random colors for borders
  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    return (
      "#" +
      Array.from({ length: 6 })
        .map(() => letters[Math.floor(Math.random() * 16)])
        .join("")
    );
  }

  items.forEach((item, index) => {
    item.rects.forEach((bbox) => {
      const borderElement = document.createElement("div");
      const borderColor = getRandomColor();

      borderElement.style.outline = `1px dashed ${borderColor}`;
      borderElement.style.position = "fixed";
      borderElement.style.left = bbox.left + "px";
      borderElement.style.top = bbox.top + "px";
      borderElement.style.width = bbox.width + "px";
      borderElement.style.height = bbox.height + "px";
      borderElement.style.pointerEvents = "none";
      borderElement.style.boxSizing = "border-box";
      borderElement.style.zIndex = 2147483647;

      const label = document.createElement("span");
      label.textContent = index;
      label.style.position = "absolute";
      label.style.top = "-12px";
      label.style.left = "0px";
      label.style.background = borderColor;
      label.style.color = "white";
      label.style.padding = "1px 3px";
      label.style.fontSize = "10px";
      label.style.borderRadius = "2px";
      label.style.fontWeight = "bold";
      label.style.lineHeight = "1"; // Added to keep it compact
      label.style.zIndex = "2147483647";
      borderElement.appendChild(label);

      document.body.appendChild(borderElement);
      labels.push(borderElement);
    });
  });

  const coordinates = items.flatMap((item) =>
    item.rects.map(({ left, top, width, height }) => ({
      x: left,
      y: top,
      width,
      height,
      type: item.type,
      text: item.text,
      selector: item.selector,
    }))
  );

  return coordinates;
}

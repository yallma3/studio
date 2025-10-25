import React, { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position if menu would go off-screen
      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position if menu would go off-screen
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${Math.max(10, adjustedX)}px`;
      menu.style.top = `${Math.max(10, adjustedY)}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 py-1 min-w-[180px]"
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: "rgba(17, 17, 17, 0.95)",
        borderRadius: 8,
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        borderLeft: "1px solid rgba(255, 199, 44, 0.2)",
        backdropFilter: "blur(10px)",
        color: "white",
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={`separator-${index}`}
              className="my-1 border-t"
              style={{ borderColor: "rgba(255, 199, 44, 0.15)" }}
            />
          );
        }

        const disabled = !!item.disabled;
        return (
          <button
            key={index}
            onClick={() => {
              if (!disabled) {
                item.onClick();
                onClose();
              }
            }}
            style={{
              color: item.label === "Delete" ? "#FF6B6B" : "#FFC72C",
            }}
            disabled={disabled}
            className={`${
              disabled
                ? "text-gray-500 cursor-not-allowed"
                : "hover:bg-[#222] cursor-pointer"
            } w-full text-left px-3 py-2 text-sm flex items-center gap-2`}
          >
            {item.icon && (
              <span
                className="text-base leading-none"
                style={{
                  color: item.label === "Delete" ? "#FF6B6B" : "#FFC72C",
                }}
              >
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;

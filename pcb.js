"use strict";


(() => {

    const root =
        document.getElementById(
            "bcpRoot"
        );


    const button =
        document.getElementById(
            "bcpButton"
        );


    const surface =
        document.getElementById(
            "bcpSurface"
        );


    const close =
        document.getElementById(
            "bcpClose"
        );


    if (
        !root ||
        !button ||
        !surface
    ) {

        return;

    }


    let opened =
        false;


    function openPanel() {

        if (opened) return;


        opened =
            true;


        root.classList.add(
            "open"
        );


        button.setAttribute(
            "aria-expanded",
            "true"
        );


        surface.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closePanel() {

        if (!opened) return;


        opened =
            false;


        root.classList.remove(
            "open"
        );


        button.setAttribute(
            "aria-expanded",
            "false"
        );


        surface.setAttribute(
            "aria-hidden",
            "true"
        );


        button.focus();

    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            if (opened) {

                closePanel();

            }

            else {

                openPanel();

            }

        }
    );


    close?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closePanel();

        }
    );


    document.addEventListener(
        "pointerdown",
        event => {

            if (
                opened &&
                !root.contains(
                    event.target
                )
            ) {

                closePanel();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape" &&
                opened
            ) {

                closePanel();

            }

        }
    );


    surface
        .querySelectorAll(
            "a"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        closePanel();

                    }
                );

            }
        );


    root.bcp = {

        open:
            openPanel,

        close:
            closePanel,

        toggle:
            () => {

                opened
                    ? closePanel()
                    : openPanel();

            },

        isOpen:
            () =>
                opened

    };


})();
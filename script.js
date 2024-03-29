window.onload = () => {
    // predefined bets
    const item = ["rock", "paper", "scissors"];
    // predefined modal messages
    const messages = (item) => ({
        userBet: { header: "WAITING CURB’S CHOOSE" },
        botBet: {
            userLost: {
                header: "YOU LOST!",
                result: `Curb with ${item} wins`
            },
            userWon: {
                header: "YOU WON!",
                result: `You win with ${item}`
            },
            draw: {
                header: "DRAW!",
                result: `Both sides picked ${item}`
            }
        }
    });
    // get API bet
    const getApiBet = () => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            // used proxy https://yacdn.org/serve/ due to
            // Access to XMLHttpRequest at 'https://5eddt4q9dk.execute-api.us-east-1.amazonaws.com/rps-stage/throw'
            // from origin 'https://anna-artyushkevich.github.io' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
            xhr.open(
                "GET",
                "https://yacdn.org/serve/https://5eddt4q9dk.execute-api.us-east-1.amazonaws.com/rps-stage/throw"
            );
            xhr.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        let text = JSON.parse(this.responseText);
                        resolve(text.body);
                    } else {
                        reject(new Error("Error"));
                    }
                }
            };
            xhr.send();
        });
    };
    // generate random number, min and max included
    const randomIntFromInterval = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };
    // calculate winner
    const getWinner = (userBet, botBet) => {
        let winner = {};
        const ui = item.indexOf(userBet);
        const bi = item.indexOf(botBet);
        const length = item.length - 1;

        if ((!ui && bi === length) || (!bi && ui === length)) {
            if (ui > bi) {
                winner = { result: "userLost", item: botBet };
            } else {
                winner = { result: "userWon", item: userBet };
            }
        } else {
            if (ui > bi) {
                winner = { result: "userWon", item: userBet };
            } else if (ui < bi) {
                winner = { result: "userLost", item: botBet };
            } else {
                winner = { result: "draw", item: userBet };
            }
        }
        return winner;
    };
    // variables for clearing timeout
    let timeoutBotBet, timeoutResult;
    // change modal DOM object
    const changeModal = opt => {
        const {
            visibleClass,
            resultClass,
            header,
            result,
            items
        } = opt;

        const modal = document.getElementById("modal");
        const modalHeader = modal.querySelector(".modal-header");
        const modalItemUser = modal.querySelector(".item-user");
        const modalItemBot = modal.querySelector(".item-bot");
        const modalItemWin = modal.querySelector(".item-win");

        resultClass &&
            (resultClass === "add"
                ? modal.classList.add("result")
                : modal.classList.remove("result"));
        if (header) modalHeader.dataset.header = header;
        if (result) modalHeader.dataset.result = result === "clear" ? "" : result;

        items &&
            [modalItemUser, modalItemBot, modalItemWin].forEach((elem, index) => {
                const id = elem.id;
                if (items[id]) {
                    elem.dataset.item = items[id] === "clear" ? "" : items[id];
                }
            });

        visibleClass &&
            (visibleClass === "add"
                ? modal.classList.add("visible")
                : modal.classList.remove("visible"));
    };
    // start game click listener
    document
        .getElementById("game")
        .addEventListener("click", event => {
            const target = event.target;

            if (target.classList.contains("item")) {
                // clear modal data-attributes
                let header = messages().userBet.header;
                changeModal({
                    visibleClass: "remove",
                    resultClass: "remove",
                    header: header,
                    result: "clear",
                    items: { itemUser: "clear", itemBot: "clear", itemWin: "clear" }
                });

                // start game
                // initialize data-attributes - user bet
                let userBet = target.dataset.item;
                changeModal({
                    visibleClass: "add",
                    items: { itemUser: userBet }
                });

                let apiBet = "";
                getApiBet()
                    .then(text => {
                        apiBet = text.replace(/"/g, "");
                    })
                    .catch(err => {
                        console.error(err); //
                    });

                timeoutBotBet = setTimeout(() => {
                    // get bot bet
                    let botBet =
                        apiBet && item.includes(apiBet)
                            ? apiBet
                            : item[randomIntFromInterval(0, 2)];

                    // initialize data-attributes - bot bet
                    changeModal({
                        items: {itemBot: botBet}}
                    );

                    const winner = getWinner(userBet, botBet);

                    // show result
                    timeoutResult = setTimeout(() => {
                        header = messages().botBet[winner.result].header;
                        const result = messages(winner.item).botBet[
                            winner.result
                        ].result;
                        changeModal({
                            resultClass: "add",
                            header: header,
                            result: result,
                            items: {itemWin: winner.item}
                        });
                    }, 750);
                }, 2000);
            }
        });
    // close modal click listener
    [".close", ".btn"].forEach(elem => {
        const modal = document.getElementById("modal");
        modal.querySelector(elem)
            .addEventListener("click", event => {
                modal.classList.remove("visible");
                [timeoutResult, timeoutBotBet].forEach(timeout => {
                    clearTimeout(timeout);
                });
            });
    });
};

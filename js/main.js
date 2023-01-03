/*----- constants -----*/
const ships = [
    {
        name: 'CARRIER',
        width: 5,
        color: '#FFAD00',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [], 
        hits: 0,
    },
    {
        name: 'BATTLESHIP',
        width: 4,
        color: '#39ff14',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
    {
        name: 'DESTROYER',
        width: 3,
        color: '#FF10F0',
        dom: null,
        translateCordinates: [], 
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
    {
        name:'SUBMARINE',
        width: 3,
        color: '#04d9ff',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
    {
        name: 'PATROL',
        width: 2,
        color: '#FFF01F',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
        hits: 0,
    },
]

const numbers = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

class Player {
    constructor(id, automated) {
        this.id = id
        this.automated = automated
        this.name = (automated === true) ? 'Computer' : `Player ${this.id}` 
        this.ships = JSON.parse(JSON.stringify(ships))
        this.placed = 0
        this.board = []
        // should this be in the constructor or somewhere else ?
        letters.forEach(letter => {
            for (let i = 1; i < numbers.length; i++) {
                const tile = {}
                tile.name = letter+numbers[i]
                tile.content = null  // filled with shipName, miss, or *shipName (if hit)
                this.board.push(tile)
            }
        })
        this.boardDom = ''
    }
}

/*----- app's state (variables) -----*/
let player1, player2, curPlayer, curShip, gameStatus = 'waiting'

/*----- cached element references -----*/
const playComEl = document.getElementById('vsComputer')
const player1BoardEl = document.getElementById('player1Board')
const player2BoardEl = document.getElementById('player2Board')
const resetBtn = document.getElementById('reset')
const readyBtn = document.getElementById('ready')
const msg = document.getElementById('msg')
const msg2 = document.getElementById('msg2')
const shipMsgContainers = document.querySelectorAll('.ship-msg-container')

/*----- event listeners -----*/
playComEl.addEventListener('click', buildGame)
player1BoardEl.addEventListener('dragover', dragOver)
player1BoardEl.addEventListener('drop', dragDrop)
resetBtn.addEventListener('click', resetGame)
readyBtn.addEventListener('click', startGame)

/*----- functions -----*/
function init() {
    render()
}

function buildGame() {
    player1 = new Player(1, false)
    player1.boardDom = player1BoardEl
    player2 = new Player(2, true)
    player2.boardDom = player2BoardEl
    curPlayer = player1
    gameStatus = 'building'
    render()
}

function resetGame() {
    curPlayer = null
    curShip = null
    player1 = null
    player2 = null
    gameStatus = 'waiting'
    render()
}

function startGame() {
    if(player2.automated === true) generateComputerBoard()
    gameStatus = 'playing'
    lockBoard()
    render()
}

function getCurShip(e) {
    if (!e.target.id) {
        curShip = curPlayer.ships.find(ship => ship.name === e.target.parentElement.id)
        curShip.dom = e.target.parentElement
    } else {
        curShip = curPlayer.ships.find(ship => ship.name === e.target.id)
        curShip.dom = e.target
    }
}

function dragStart(e) {
    getCurShip(e)
    curShip.shipGrabbedX = e.offsetX
    curShip.shipGrabbedY = e.offsetY
}

function dragOver(e) {
    const dropX = (e.offsetX - curShip.shipGrabbedX)
    const dropY = (e.offsetY - curShip.shipGrabbedY)
    // cannot drop ship on itself or another ship
    if(e.target !== curShip.dom && e.target !== curShip.dom.firstChild && e.target.parentElement.classList[0] !== 'ship') e.preventDefault()
}

function dragDrop(e) {
    e.preventDefault()
    const dropX = (Math.round((e.offsetX - curShip.shipGrabbedX) / 49) * 49)+2
    const dropY = (Math.round((e.offsetY - curShip.shipGrabbedY) / 49) * 49)+1
    if (getSquaresOccupied(dropX,dropY,null,1)) {
        dropShip(dropX,dropY)    
    }
}

function clickShip(e) {
    getCurShip(e)
    if (curShip && curShip.dom.parentElement.id.search('Board') > 0) {
        if(getSquaresOccupied(curShip.translateCordinates[0],curShip.translateCordinates[1],null,-1)) {
            curShip.rotated *= -1
            rotateShip()
        }
    }       
}

function getSquaresOccupied(x,y,starting,rotated){
    let startingSquare = starting
    let idxX = x
    let idxY = y
    // validate against placement off the board
    if (idxX < 1 || idxY < 1) {
        return false
    } 
    // get starting square
    // logic only for physically dropped ships
    if (!startingSquare) {
        idxX = Math.ceil(x / 49)
        idxY = Math.ceil(y / 49)
        startingSquare = letters[idxY-1]+numbers[idxX]
    }
    let squares = [startingSquare]
    const startLetter = startingSquare[0]
    const startNum = startingSquare.slice(1,startingSquare.length)
    // horizontal
    if (curShip.rotated*rotated === -1) {
        for (let i = 1; i < curShip.width; i++ ) {
            const numIdx = numbers.indexOf(startNum)
            const num = numbers[numIdx + i]
            const sqr = startLetter + num
            squares.push(sqr)     
        }
    } else { // vertical 
        for (let i = 1; i < curShip.width; i++ ) {
            const letterIdx = letters.indexOf(startLetter)
            const letter = letters[letterIdx + i]
            const sqr = letter + startNum
            squares.push(sqr)   
        }
    }
    // validate that squares are open
    if (squares.find(sqr => sqr.includes('undefined'))) {
        return false
    } else {
        return checkBoardPlacement(squares,rotated)
    }
}

function checkBoardPlacement(squaresArr, rotated) {
    let result = (rotated === -1) ? 1 : 0
    squaresArr.forEach(sqr => {
        const tile = curPlayer.board.find(tile => tile.name === sqr)
        result += (tile.content === null) ? 1 : 0
    })
    if(result === squaresArr.length) {
        updateBoardPlacement(squaresArr)
        return true
    } else {
        return false
    }
}

function updateBoardPlacement(squaresArr) {
    // check if ship is already placed on the board
    // if it is, remove
    let found = curPlayer.board.find(tile => tile.content === curShip.name)
    if (found) {
        for (let i = 0; i < curShip.width; i++) {
            found = curPlayer.board.find(tile => tile.content === curShip.name)
            found.content = null
        }
    }
    // update tiles with new position
    squaresArr.forEach(sqr => {
        const tile = curPlayer.board.find(tile => tile.name === sqr)
        tile.content = curShip.name
    })
    // update curShip squares occupied
    curShip.squaresOccupied = squaresArr
    // check curPlayer's placed ship count
    checkShipsPlaced()
}

function checkShipsPlaced() {
    let shipNames = []
    let placed = 0
    curPlayer.ships.forEach(ship => shipNames.push(ship.name))
    shipNames.forEach(ship => {
        if(curPlayer.board.find(tile => tile.content === ship)) placed += 1
    })
    curPlayer.placed = placed
    render()
}

function lockBoard() {
    const player1Ships = document.querySelectorAll('.ship')
    player1Ships.forEach(ship => {
        ship.removeEventListener('dragstart', dragStart)
        ship.draggable = false
    })  
    const player1ShipStyles = document.querySelectorAll('.ship-style')
    player1ShipStyles.forEach(ship => ship.removeEventListener('click', clickShip))
    player1BoardEl.removeEventListener('dragover', dragOver)

}

function unlockBoard() {
    player1BoardEl.addEventListener('dragover', dragOver)
}

function generateComputerBoard() {
    curPlayer = player2
    curPlayer.ships.forEach(ship => {
        let randStartSquare = ''
        // 0 translates to vertical and 1 translates to horizontal
        let randDirection = Math.round(Math.random() * 1)
        let x = 0, y = 0
        curShip = ship
        while (!getSquaresOccupied(x,y,randStartSquare,randDirection)) {
            randStartSquare = ''
            x = 0, y = 0
            while (!randStartSquare) {
                const randIdx = Math.round(Math.random() * (curPlayer.board.length-1))
                if (curPlayer.board[randIdx].content === null) {
                    randStartSquare = curPlayer.board[randIdx].name
                    x = 1, y = 1
                }
            }
        }
        curShip.rotated = (randDirection === 0) ? 1 : -1
    })
    changeTurns()
}

function changeTurns() {
    curPlayer = (curPlayer === player1) ? player2 : player1
    render()
}

function attack(e) {
    if(!e.target.id) {
        msg2.innerText += ' - you\'ve already attacked that space'
        return
    } else {
        render()
    }
    const recipient = (curPlayer === player1) ? player2 : player1
    const idxX = Math.ceil(e.offsetX / 49)
    const idxY = Math.ceil(e.offsetY / 49)
    const target = letters[idxY-1] + numbers[idxX]
    // check board
    const boardTarget = recipient.board.find(tile => tile.name === target)
    if (boardTarget.content === null) {
        createAttack(recipient, idxX-1, idxY-1, 'miss', target)
        boardTarget.content = 'miss'
    } else if(boardTarget.content !== 'miss' && boardTarget.content[0] !== '*') {
        createAttack(recipient, idxX-1, idxY-1, 'hit', target)
        checkForSink(recipient, recipient.ships.find(ship => ship.name === boardTarget.content))
        boardTarget.content = '*' + boardTarget.content
    }
}

function checkForSink(player, hitShip) {
    let sunk = 0
    hitShip.hits += 1
    if(hitShip.hits === hitShip.width) {
        hitShip.squaresOccupied.forEach( sqr => {
            const tile = document.getElementById(sqr)
            tile.style.backgroundColor = hitShip.color
        })
        recipient.ships.forEach( ship => {
            if(ship.width === ship.hits) {
                sunk += 1
            }
        })
        if(sunk === recipient.ships.length) {
            winner = (player === player1) ? player2 : player1
            gameStatus = 'over'
            render()
        }
    }
}

/*----- render functions -----*/
function render() {
    if(gameStatus === 'waiting') {
        playComEl.style.display = 'block'
        clearBoard()
        unlockBoard()
    } 
    if(gameStatus === 'building') {
        msg.innerText = 'Place Your Ships'
        playComEl.style.display = 'none'
        resetBtn.style.display = 'block'
        player1BoardEl.style.display = 'block'
        player1BoardEl.parentElement.style.display = 'grid'
        if(player1BoardEl.parentElement.querySelector('.letters').children.length === 0) {
            buildGridLabels(player1BoardEl)
        }
        if(!document.querySelector('.ship')) {
            buildShips(player1)
        }
        if(curPlayer.placed === ships.length) {
            readyBtn.style.display = 'block'
            msg.innerText = '<--- click when you\'re happy with your ship placement'
        }
    }
    if(gameStatus === 'playing') {
        msg.innerText = ''
        msg2.innerText = `${curPlayer.name}'s Move`
        readyBtn.style.display = 'none'
        player2BoardEl.style.display = 'block'
        player2BoardEl.parentElement.style.display = 'grid'
        if(player2BoardEl.parentElement.querySelector('.letters').children.length === 0) {
            buildGridLabels(player2BoardEl)
        }
        shipMsgContainers.forEach(msgContainer => msgContainer.style.display = 'block')
        player2BoardEl.addEventListener('click', attack)
    }
    if(gameStatus === '') {
        msg2.innerText = `${winner.name} Wins !`
    }
}

function buildGridLabels(boardEl) {
    const lettersEl = boardEl.parentElement.querySelector('.letters')
    const numbersEl = boardEl.parentElement.querySelector('.numbers')
    letters.forEach(letter => {
        const letterDiv = document.createElement('div')
        letterDiv.innerText = letter
        lettersEl.appendChild(letterDiv)
    })
    numbers.forEach(number => {
        const numberDiv = document.createElement('div')
        numberDiv.innerText = number
        numbersEl.appendChild(numberDiv)
    })
}

function buildShips(player) {
    player.ships.forEach( ship => {
        const newShip = document.createElement('div')
        const newShipStyle = document.createElement('div')
        newShip.appendChild(newShipStyle)
        newShip.setAttribute('draggable', true)
        newShip.setAttribute('class', 'ship')
        newShip.setAttribute('id', ship.name)
        newShip.style.width = `${ship.width * 3}rem`
        newShip.addEventListener('dragstart', dragStart)
        newShipStyle.setAttribute('class', 'ship-style')
        newShipStyle.style.backgroundColor = ship.color
        newShipStyle.style.width = `${ship.width * 3}rem`
        newShipStyle.innerText = ship.name
        newShipStyle.addEventListener('click', clickShip)
        document.querySelector('#shipYard').appendChild(newShip)
    })
}

function dropShip(x,y) {
    curShip.dom.style.transform = `translate(${x}px,${y}px)`
    curShip.translateCordinates = [x,y]
    curShip.dom.style.position = 'absolute'
    curShip.dom.classList.add('placed')
    player1BoardEl.appendChild(curShip.dom)
}

function rotateShip() {
    curShip.dom.style.width = curShip.rotated === -1 ? `${curShip.width * 3}rem` : '3rem'
    let rotateBy
    if (curShip.width % 2 === 0) {
        if (curShip.rotated === 1) {
            rotateBy = (curShip.width * 12) + (25 * (curShip.width/2 - 1)) - (curShip.width/2 - 1)
        } 
    } else {
        if (curShip.rotated === 1) {
            rotateBy = (Math.round(((curShip.width * 12) + 25)/48) * 48) + 1  
        } 
    }
    curShip.dom.firstChild.style.transform = curShip.rotated === -1 ? '' : `translate(-${rotateBy}px,${rotateBy}px) rotate(90deg)`
}

function createAttack(player, x, y, result, tile) {
    const attack = document.createElement('div')
    attack.classList.add(result)
    // x = (Math.floor(x / 49) * 49) + 8
    // y = (Math.floor(y / 49) * 49) + 8
    x = (x * 49) + 8
    y = (y * 49) + 8
    attack.style.transform = `translate(${x}px,${y}px)`
    attack.id = tile
    player.boardDom.append(attack)
}

function clearBoard() {
    msg.innerText = ''
    resetBtn.style.display = 'none'
    readyBtn.style.display = 'none'
    player1BoardEl.style.display = 'none'
    shipMsgContainers.forEach( msgContainer => msgContainer.style.display = 'none')

    if(document.querySelector('.ship')) {
        document.querySelectorAll('.ship').forEach(ship => ship.remove())
    }
    if(player1BoardEl.parentElement.querySelector('.letters').children.length > 0) {
        const letters = Array.from(player1BoardEl.parentElement.querySelector('.letters').children)
        letters.forEach( letter => letter.remove())
    }
    if(player1BoardEl.parentElement.querySelector('.numbers').children.length > 0) {
        const numbers = Array.from(player1BoardEl.parentElement.querySelector('.numbers').children)
        numbers.forEach(number => number.remove())
    }
    player2BoardEl.style.display = 'none'
    if(player2BoardEl.parentElement.querySelector('.letters').children.length > 0) {
        const letters = Array.from(player2BoardEl.parentElement.querySelector('.letters').children)
        letters.forEach( letter => letter.remove())
    }
    if(player2BoardEl.parentElement.querySelector('.numbers').children.length > 0) {
        const numbers = Array.from(player2BoardEl.parentElement.querySelector('.numbers').children)
        numbers.forEach(number => number.remove())
    }
    if(player2BoardEl.querySelectorAll('.miss')) {
        const misses = player2BoardEl.querySelectorAll('.miss')
        misses.forEach(miss => miss.remove())
    }
    if(player2BoardEl.querySelectorAll('.hit')) {
        const hits = player2BoardEl.querySelectorAll('.hit')
        hits.forEach(hit => hit.remove())
    }
    
}


init()

// testing
// player2BoardEl.addEventListener('mouseover', e => {
//     const fire = document.createElement('div')
//     fire.classList.add('in-motion')
//     fire.style.borderRadius = '50%'
//     fire.style.height = '2rem'
//     fire.style.width = '2rem'
//     e.target.append(fire)
// })

// player2BoardEl.addEventListener('mousemove', e => {
//     const fire = document.querySelector('.in-motion')
//     fire.style.backgroundColor = 'red'
//     // let idxX = Math.ceil(e.offsetX / 49)
//     // console.log(e.offsetX, idxX, numbers[idxX])
//     // let idxY = Math.ceil(e.offsetY / 49)
//     // console.log(e.offsetY, idxY, letters[idxY-1])
//     let idxX = Math.floor(e.offsetX / 49)
//     let idxY = Math.floor(e.offsetY / 49)
//     idxX = (idxX * 49) + 8
//     idxY = (idxY * 49) + 8
//     fire.style.transform = `translate(${idxX}px,${idxY}px)`
// })

// // player2BoardEl.addEventListener('mouseout', e => {
// //     const fire = document.querySelector('.in-motion')
// //     fire.remove()
// // })

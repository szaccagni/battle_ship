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
    },
    {
        name: 'BATTLESHIP',
        width: 4,
        color: '#39ff14',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
    },
    {
        name: 'DESTROYER',
        width: 3,
        color: '#FF10F0',
        dom: null,
        translateCordinates: [], 
        rotated: -1,
        squaresOccupied: [],
    },
    {
        name:'SUBMARINE',
        width: 3,
        color: '#04d9ff',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
    },
    {
        name: 'PATROL',
        width: 2,
        color: '#FFF01F',
        dom: null,
        translateCordinates: [],
        rotated: -1,
        squaresOccupied: [],
    },
]

const numbers = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

class Player {
    constructor(id, automated) {
        this.id = id
        this.automated = automated
        this.ships = [...ships]
        this.placed = 0
        this.board = []
        // should this be in the constructor or somewhere else ?
        letters.forEach(letter => {
            for (let i = 1; i < numbers.length; i++) {
                const tile = {}
                tile.name = letter+numbers[i]
                tile.content = null  // filled with name of ship, 
                this.board.push(tile)
            }
        })
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
    player2 = new Player(2, true)
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
    let idxX, idxY
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
    // validate that ship is on the board and squares are open
    if (idxX < 1 || idxY < 1 || squares.find(sqr => sqr.includes('undefined'))) {
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

function generateComputerBoard() {

}

/*----- render functions -----*/
function render() {
    if(gameStatus === 'waiting') {
        playComEl.style.display = 'block'
        resetBtn.style.display = 'none'
        readyBtn.style.display = 'none'
        player1BoardEl.style.display = 'none'
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
    } 
    if(gameStatus === 'building') {
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
        }
    }
    if(gameStatus === 'playing') {
        readyBtn.style.display = 'none'
        player2BoardEl.style.display = 'block'
        player2BoardEl.parentElement.style.display = 'grid'
        if(player2BoardEl.parentElement.querySelector('.letters').children.length === 0) {
            buildGridLabels(player2BoardEl)
        }
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


init()

// // // testing
// player1BoardEl.addEventListener('click', test)
// function test(e){
//     let idxX = Math.ceil(e.offsetX / 49)
//     console.log(e.offsetX, idxX, numbers[idxX])
//     let idxY = Math.ceil(e.offsetY / 49)
//     console.log(e.offsetY, idxY, letters[idxY-1])
// }
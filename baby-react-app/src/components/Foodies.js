import React, {Component} from 'react'
import axios from 'axios'

export default class Foodies extends Component {
    constructor() {
        super()

        this.state = {
            foods: [],
            foodInput: '',
        }
    }
    componentDidMount() {
        axios.get('/api/food')
        .then((res) => {


            this.setState({
                foods: res.data
            })
        })
    }

    onFoodChange = (event) => {
        const {value} = event.target

        this.setState({
            foodInput: value
        })
    }

    handleFoodSubmit = (event) => {
        event.preventDefault();

        axios.post('/api/food', {
            foodLocation: this.state.foodInput,
        })
        .then((res) => {
            this.setState((prevState) => {
                const newFoods = prevState.foods.concat(res.data)
                return {
                    foodInput: '',
                    foods: res.data

                }
            })
        })
    }

    render() {
        return(
            <div>
                <h5>Your fav foods</h5>
                {this.state.foods.map((food) => {
                    return <p key={food.id}>{food.name}</p>
                })}
                <br />
                <p>Add some more fav foods</p>
                <form onSubmit={this.handleFoodSubmit}>
                    <input 
                        value={this.state.foodInput}
                        onChange={this.onFoodChange}
                        />
                    <button type="submit">Submit</button>
                </form>
            </div>
        )
    }
}
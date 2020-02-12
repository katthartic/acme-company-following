/* eslint-disable react/react-in-jsx-scope */
const API = 'https://acme-users-api-rev.herokuapp.com/api'
const { Component } = React
const { render } = ReactDOM

const fetchUser = async () => {
  const storage = window.localStorage
  const userId = storage.getItem('userId')

  if (userId) {
    try {
      return (await axios.get(`${API}/users/detail/${userId}`)).data
    } catch (ex) {
      storage.removeItem('userId')
      return fetchUser()
    }
  }
  const user = (await axios.get(`${API}/users/random`)).data
  storage.setItem('userId', user.id)
  return user
}

const setupApp = async () => {
  const user = await fetchUser()
  const companies = (await axios.get(`${API}/companies`)).data
  const following = (
    await axios.get(`${API}/users/${user.id}/followingCompanies`)
  ).data

  return {
    user,
    companies,
    following
  }
}

const updateFollowing = async (userId, companyId, rating, followee) => {
  let currentFollowee = {}
  const followeeList = (
    await axios.get(`${API}/users/${userId}/followingCompanies`)
  ).data
  console.log('updateFollowing-following list', followeeList)

  if (followee && rating) {
    console.log('updateFollowing-put', followee)
    currentFollowee = (
      await axios.put(
        `${API}/users/${userId}/followingCompanies/${followee.id}`,
        { rating, companyId }
      )
    ).data
  } else if (followee && !rating) {
    console.log('updateFollowing-deletefollowee', followee)
    await axios.delete(
      `${API}/users/${userId}/followingCompanies/${followee.id}`
    )
  } else {
    if (followeeList.length === 5) {
      console.log('updateFollowing-delete', followeeList[0])
      await axios.delete(
        `${API}/users/${userId}/followingCompanies/${followeeList[0].id}`
      )
    }

    currentFollowee = (
      await axios.post(`${API}/users/${userId}/followingCompanies`, {
        rating,
        companyId
      })
    ).data
    console.log('updateFollowing-post', currentFollowee)
  }

  const newList = await axios.get(`${API}/users/${userId}/followingCompanies`)

  console.log('updateFollowing-newList', newList)

  return newList
}

class App extends Component {
  constructor() {
    super()
    this.state = {
      user: {},
      following: [],
      companies: []
    }
    this.onUpdate = this.onUpdate.bind(this)
  }

  onUpdate(rating, companyId) {
    const { user, following } = this.state
    const followeeIdx = following
      .map(company => company.companyId)
      .findIndex(followId => followId === companyId)

    updateFollowing(user.id, companyId, rating, following[followeeIdx]).then(
      response => {
        this.setState({ following: response.data })
        console.log('onUpdate-state', this.state)
      }
    )
  }

  componentDidMount() {
    setupApp().then(response => this.setState(response))
  }

  render() {
    const { user, companies, following } = this.state
    const choices = ['', 1, 2, 3, 4, 5]
    const { onUpdate } = this
    return (
      <div>
        <h1>Acme Company Follower</h1>
        <h2>
          You ({user.fullName}) are following {following.length} Companies
        </h2>
        <form>
          {companies.map(company => {
            const followingCompany = following.find(
              followee => followee.companyId === company.id
            )
            const getRating = () => {
              if (followingCompany) {
                return followingCompany.rating
              } else {
                return ''
              }
            }

            const rating = getRating()

            return (
              <div className="companies" key={company.id}>
                <label className={followingCompany ? 'following' : ''}>
                  {company.name}
                  <select
                    value={rating}
                    onChange={ev => onUpdate(ev.target.value, company.id)}>
                    {choices.map(choice => {
                      return (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      )
                    })}
                  </select>
                </label>
              </div>
            )
          })}
        </form>
      </div>
    )
  }
}

const root = document.querySelector('#root')
render(<App />, root)

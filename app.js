const API = "https://acme-users-api-rev.herokuapp.com/api";
const { Component } = React;
const { render } = ReactDOM;

const fetchUser = async () => {
    const storage = window.localStorage;
    const userId = storage.getItem("userId");

    if (userId) {
        try {
            return (await axios.get(`${API}/users/detail/${userId}`)).data;
        } catch (ex) {
            storage.removeItem("userId");
            return fetchUser();
        }
    }
    const user = (await axios.get(`${API}/users/random`)).data;
    storage.setItem("userId", user.id);
    return user;
};

const setupApp = async () => {
    const user = await fetchUser();
    const companies = (await axios.get(`${API}/companies`)).data;
    const following = (
        await axios.get(`${API}/users/${user.id}/followingCompanies`)
    ).data;

    return {
        user,
        companies,
        following
    };
};

class App extends Component {
    constructor() {
        super();
        this.state = {
            user: {},
            following: [],
            companies: []
        };
        this.onUpdate = this.onUpdate.bind(this);
    }

    onUpdate(change) {
        console.log("change", change);
        //   this.setState(change);
    }

    componentDidMount() {
        setupApp().then(response => this.setState(response));
    }

    render() {
        const { user, companies, following } = this.state;
        const choices = ["", 1, 2, 3, 4, 5];
        const { onUpdate } = this;
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
                        );
                        const getRating = () => {
                            if (followingCompany) {
                                return followingCompany.rating;
                            } else {
                                return "";
                            }
                        };

                        const rating = getRating();

                        return (
                            <label
                                className={followingCompany ? "following" : ""}
                                key={company.id}
                            >
                                {company.name}
                                <select
                                    value={rating}
                                    onChange={ev => onUpdate(ev.target.value)}
                                >
                                    {choices.map(choice => {
                                        return (
                                            <option key={choice} value={choice}>
                                                {choice}
                                            </option>
                                        );
                                    })}
                                </select>
                            </label>
                        );
                    })}
                </form>
            </div>
        );
    }
}

const root = document.querySelector("#root");
render(<App />, root);
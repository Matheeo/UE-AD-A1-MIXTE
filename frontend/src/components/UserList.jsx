import React, { useEffect, useState } from "react";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem, Paper,
    Select,
    Table, TableBody, TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography, useMediaQuery
} from "@mui/material";
import {useSpring, animated} from "@react-spring/web";

const UserList = () => {
    const [userData, setUserData] = useState([]);
    const [userid, setUserid] = useState("");
    const [userNbMovies, setUserNbMovies] = useState(0);
    const [userMoviesTitlesBooked, setUserMoviesTitlesBooked] = useState([]);
    const [requestMoviesTitleIsDone, setRequestMoviesTitleIsDone] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:3203/users");
                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUser();
    }, []);

    const springs = useSpring({
        from: { number: 0 },
        to: { number: userNbMovies },
        config: { duration: 1000 },
    });

    const isMobile = useMediaQuery('(max-width:600px)');

    const fetchUserDetails = async (userid) => {

        try {
            const response = await fetch(`http://localhost:3203/users/${userid}/movies/watched-count`);
            const data = await response.json();
            setUserNbMovies(data["watched-count"]);
        } catch (error) {
            console.error("Error fetching user watched count:", error);
        }

        try {
            setRequestMoviesTitleIsDone(false)
            const response = await fetch(`http://localhost:3203/users/${userid}/movies/titles`);
            const data = await response.json();
            let moviesTitlesBooked = data.titles;
            setUserMoviesTitlesBooked(moviesTitlesBooked)
            setRequestMoviesTitleIsDone(true)
        } catch (error) {
            setRequestMoviesTitleIsDone(true)
            console.error("Error fetching user watched movies:", error);
        }
    };

    return (
        <div>
            <Typography variant="h3" gutterBottom sx={{mt: "3%", mb: "4%"}}>
                Gestion des utilisateurs
            </Typography>
            <FormControl sx={{ width: "85%", mx: "3%"}}>
                <InputLabel id="select-label">Choisissez une personne</InputLabel>
                <Select
                    labelId="select-user"
                    value={userid}
                    onChange={(e) => {
                        setUserid(e.target.value);
                        if (e.target.value) {
                            setUserNbMovies(0);
                            setUserMoviesTitlesBooked([]);
                            fetchUserDetails(e.target.value);
                        }
                    }}
                    label="Choisissez un utilisateur"
                >
                    {userData.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                            {user.name}
                        </MenuItem>
                    ))}
                    {userData.length === 0 && (
                        <MenuItem disabled>
                            Erreur lors du chargement des utilisateurs ou aucun utilisateur trouvé
                        </MenuItem>
                    )}
                    {userData.length > 0 && (
                        <MenuItem value={""}>Aucun</MenuItem>
                    )}
                </Select>
            </FormControl>

            {userid && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        mt: 3,
                        mb: 4,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: isMobile ? 3 : 0,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Nombre de films regardés :
                        </Typography>
                        <animated.div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {springs.number.to((val) => Math.floor(val))}
                        </animated.div>
                    </Box>

                    <Box sx={{ width: isMobile ? '100%' : '60%' }}>
                        <Typography variant="h6" gutterBottom align={isMobile ? 'center' : 'left'}>
                            Liste des films regardés ou réservés
                        </Typography>

                        {userMoviesTitlesBooked.length > 0 ? (
                            <TableContainer component={Paper} sx={{ width: '100%', mt: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {userMoviesTitlesBooked.map((movie) => (
                                            <TableRow key={movie.id}>
                                                <TableCell align="center">{movie.title}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : requestMoviesTitleIsDone ? (
                            <Typography variant="h7" align="center" sx={{ mt: 4 }}>
                                Aucun film réservé.
                            </Typography>
                        ) : (
                            <Typography variant="h7" align="center" sx={{ mt: 4 }}>
                                Chargement en cours...
                            </Typography>
                        )

                        }
                    </Box>
                </Box>
            )}


        </div>
    );
};

export default UserList;

/* gloss.js: hover definitions for every WNBA column. Line format: [groups:]LABEL|Full name|What it tells you */
addGloss(`
GP|Games played|Games the player or team appeared in.
MPG|Minutes per game|Average minutes played each game.
MIN|Minutes|Total minutes played.
PPG|Points per game|Average points scored per game.
tdf:PPG|Points per game|Average points the team scored per game.
PTS|Points|Total points scored.
FGA/G|Field-goal attempts per game|Shots taken from the floor per game.
3PM/G|Three-pointers made per game|Threes made per game.
3PA/G|Three-point attempts per game|Threes attempted per game.
FTA/G|Free-throw attempts per game|Free throws attempted per game.
EFF/G|Efficiency per game|(PTS + REB + AST + STL + BLK) minus missed shots and turnovers, per game.
FG%|Field-goal percentage|Field goals made divided by attempted.
3P%|Three-point percentage|Threes made divided by attempted.
FT%|Free-throw percentage|Free throws made divided by attempted.
FGM|Field goals made|Shots made from the floor.
FGA|Field-goal attempts|Shots taken from the floor.
3PM|Three-pointers made|Threes made.
3PA|Three-point attempts|Threes attempted.
FTM|Free throws made|Free throws made.
FTA|Free-throw attempts|Free throws attempted.
TS%|True shooting percentage|Scoring efficiency counting twos, threes and free throws: PTS / (2 × (FGA + 0.44 × FTA)).
eFG%|Effective field-goal percentage|FG% adjusted so a three counts 1.5 times a two.
3PA rate|Three-point attempt rate|Share of field-goal attempts that are threes.
FT rate|Free-throw rate|Free-throw attempts per field-goal attempt.
USG%|Usage rate|Share of team possessions the player ends with a shot, free throws or a turnover while on the floor.
APG|Assists per game|Average assists per game.
AST|Assists|Total assists.
TOV/G|Turnovers per game|Average turnovers per game.
TOV|Turnovers|Total turnovers.
AST/TO|Assist-to-turnover ratio|Assists divided by turnovers.
AST%|Assist percentage|Share of teammates' field goals the player assisted while on the floor.
RPG|Rebounds per game|Average rebounds per game.
REB|Rebounds|Total rebounds.
REB%|Rebound percentage|Share of available rebounds the player grabbed while on the floor.
SPG|Steals per game|Average steals per game.
BPG|Blocks per game|Average blocks per game.
tdf:SPG|Steals per game|Average steals the team makes per game.
tdf:BPG|Blocks per game|Average blocks the team makes per game.
STL|Steals|Total steals.
BLK|Blocks|Total blocks.
Stocks/G|Steals plus blocks per game|Combined steals and blocks, a quick measure of defensive activity.
PTS/36|Points per 36 minutes|Points scaled to 36 minutes of playing time.
REB/36|Rebounds per 36 minutes|Rebounds scaled to 36 minutes.
AST/36|Assists per 36 minutes|Assists scaled to 36 minutes.
STL/36|Steals per 36 minutes|Steals scaled to 36 minutes.
BLK/36|Blocks per 36 minutes|Blocks scaled to 36 minutes.
TOV/36|Turnovers per 36 minutes|Turnovers scaled to 36 minutes.
PF/G|Personal fouls per game|Average personal fouls per game.
DD|Double-doubles|Games with ten or more in two of points, rebounds, assists, steals and blocks.
TD|Triple-doubles|Games with ten or more in three of points, rebounds, assists, steals and blocks.
Tech|Technical fouls|Technical fouls assessed.
W|Wins|Games won.
L|Losses|Games lost.
W%|Winning percentage|Wins divided by games played.
Net pts/G|Net points per game|Points scored minus points allowed per game (scoring margin).
ORtg|Offensive rating|Points scored per 100 possessions.
Pace|Pace|Possessions per game.
TOV%|Turnover rate|Turnovers per 100 plays.
OREB%|Offensive rebound rate|Share of the team's missed shots that it rebounds.
OREB/G|Offensive rebounds per game|Offensive rebounds per game.
AST/FGM|Assists per field goal made|Share of made baskets that were assisted.
Opp PPG|Opponent points per game|Average points allowed per game.
DRtg|Defensive rating|Points allowed per 100 possessions.
NetRtg|Net rating|Offensive rating minus defensive rating: point margin per 100 possessions.
Opp FG%|Opponent field-goal percentage|Shooting percentage the team allows.
Opp 3P%|Opponent three-point percentage|Three-point percentage the team allows.
Opp FT%|Opponent free-throw percentage|Free-throw percentage opponents shoot.
Opp 3PA/G|Opponent three-point attempts per game|Threes opponents attempt per game.
Opp eFG%|Opponent effective field-goal percentage|Opponents' eFG%, with threes weighted 1.5.
Opp TOV%|Opponent turnover rate|Turnovers the defense forces per 100 opponent plays.
DREB%|Defensive rebound rate|Share of opponents' misses that the team rebounds.
Opp FT rate|Opponent free-throw rate|Free-throw attempts the team allows per field-goal attempt.
DREB/G|Defensive rebounds per game|Defensive rebounds per game.
Reb diff/G|Rebound differential per game|Rebounds minus opponent rebounds, per game.
`);

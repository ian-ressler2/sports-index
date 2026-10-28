/* gloss.js: hover definitions for every NHL column. Line format: [groups:]LABEL|Full name|What it tells you */
addGloss(`
GP|Games played|Games the player or team appeared in.
TOI/G|Time on ice per game|Average minutes played each game.
TOI|Time on ice|Total minutes played.
Shifts|Shifts|Number of times the player stepped onto the ice.
G|Goals|Goals scored.
A|Assists|Primary and secondary assists on goals.
PTS|Points|Goals plus assists.
tsk,tgk:PTS|Standings points|Two for a win, one for an overtime or shootout loss.
P/GP|Points per game|Points divided by games played.
G/GP|Goals per game|Goals divided by games played.
A/GP|Assists per game|Assists divided by games played.
GWG|Game-winning goals|Goals that put the team ahead for good.
G/60|Goals per 60|Goals scaled to 60 minutes of ice time.
A/60|Assists per 60|Assists scaled to 60 minutes of ice time.
P/60|Points per 60|Points scaled to 60 minutes of ice time.
S/60|Shots per 60|Shots on goal scaled to 60 minutes of ice time.
S|Shots on goal|Shots that were saved or scored.
S/GP|Shots per game|Shots on goal per game played.
S%|Shooting percentage|Goals divided by shots on goal.
PPG|Power-play goals|Goals scored while the team had a man advantage.
PPA|Power-play assists|Assists on goals scored with a man advantage.
PPP|Power-play points|Power-play goals plus power-play assists.
Non-PP pts|Even-strength and short-handed points|Points scored outside the power play.
PP share|Power-play share of points|Percent of the player's points that came on the power play.
+/-|Plus/minus|Even-strength goals scored by the team minus goals allowed while the player is on the ice.
PIM|Penalty minutes|Minutes spent in the penalty box.
FOW|Faceoffs won|Faceoffs the player won.
FOL|Faceoffs lost|Faceoffs the player lost.
FO%|Faceoff percentage|Faceoffs won divided by faceoffs taken.
gk:SA|Shots against|Shots on goal the goalie faced.
tgk:SA|Shots against|Shots on goal the team faced.
SV|Saves|Shots on goal stopped by the goalie.
SA/60|Shots against per 60|Shots faced scaled to 60 minutes of ice time.
W|Wins|Games won.
L|Losses|Games lost in regulation.
OTL|Overtime losses|Games lost in overtime or a shootout. Worth one standings point.
W%|Win percentage|Wins divided by games played.
GA|Goals against|Goals allowed.
GAA|Goals-against average|Goals allowed per 60 minutes.
SO|Shutouts|Games where the goalie allowed no goals.
SV%|Save percentage|Saves divided by shots against.
GSAA|Goals saved above average|Goals the goalie prevented compared to an average goalie facing the same shots.
GSAA/60|Goals saved above average per 60|GSAA scaled to 60 minutes.
SV/GP|Saves per game|Saves per game played.
P%|Points percentage|Standings points earned divided by the points available.
RW|Regulation wins|Wins that did not need overtime or a shootout.
GF|Goals for|Goals scored.
GF/GP|Goals for per game|Goals scored per game.
Diff|Goal differential|Goals for minus goals against.
Diff/GP|Goal differential per game|Goal differential per game played.
Shot share|Shot share|Share of all shots on goal in the team's games that the team took (shots for / (for + against)).
PP%|Power-play percentage|Power-play goals divided by power-play opportunities.
PP opp.|Power-play opportunities|Man-advantage chances the team earned.
PP opp/GP|Power-play opportunities per game|Man-advantage chances per game.
SHG|Short-handed goals|Goals scored while the team was shorthanded.
PIM/GP|Penalty minutes per game|Minutes spent in the penalty box per game.
GA/GP|Goals against per game|Goals allowed per game.
SA/GP|Shots against per game|Shots on goal faced per game.
Shot diff/GP|Shot differential per game|Shots for minus shots against, per game.
PK%|Penalty-kill percentage|Share of opponent power plays the team kills without allowing a goal.
PDO|PDO|Shooting percentage plus save percentage. Hovers near 100; extremes are usually luck.
`);

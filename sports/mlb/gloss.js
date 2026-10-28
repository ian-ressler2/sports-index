/* gloss.js: hover definitions for every MLB column. Line format: [groups:]LABEL|Full name|What it tells you */
addGloss(`
G|Games played|Games the player or team appeared in.
PA|Plate appearances|Every trip to the plate, including walks, hit-by-pitches and sacrifices.
AB|At-bats|Plate appearances that are not walks, hit-by-pitches or sacrifices.
H|Hits|Times reaching base on a batted ball without an error or fielder's choice.
pit,tpit:H|Hits allowed|Hits given up by the pitcher or staff.
2B|Doubles|Hits that put the batter on second base.
3B|Triples|Hits that put the batter on third base.
HR|Home runs|Balls hit over the fence (or inside the park) for a run.
pit,tpit:HR|Home runs allowed|Home runs given up by the pitcher or staff.
R|Runs scored|Times the player crossed home plate.
pit,tpit:R|Runs allowed|Runs, earned or not, charged to the pitcher or staff.
RBI|Runs batted in|Runs that scored because of the batter's plate appearance.
BB|Walks|Plate appearances that ended with four balls.
pit,tpit:BB|Walks issued|Batters the pitcher or staff put on with four balls.
SO|Strikeouts|Plate appearances that ended on strike three.
pit,tpit:SO|Strikeouts|Batters the pitcher or staff struck out.
SB|Stolen bases|Bases taken while the pitcher was delivering the ball.
CS|Caught stealing|Steal attempts where the runner was thrown out.
AVG|Batting average|Hits divided by at-bats.
OBP|On-base percentage|How often the batter reaches base: hits, walks and hit-by-pitches per plate appearance.
SLG|Slugging percentage|Total bases per at-bat, so extra-base hits count for more.
OPS|On-base plus slugging|OBP plus SLG, a quick one-number view of hitting.
ISO|Isolated power|SLG minus AVG: extra bases per at-bat, a measure of raw power.
BABIP|Batting average on balls in play|Average on batted balls that stay in the field of play. Extreme values tend to regress.
wOBA|Weighted on-base average|On-base average that credits each outcome by its real run value. Scaled like OBP.
wRC+|Weighted runs created plus|Run creation adjusted for park and league. 100 is average; 120 is 20% better.
wRAA|Weighted runs above average|Batting runs contributed versus an average hitter in the same number of plate appearances.
WAR|Wins above replacement|Total wins contributed over a freely available replacement-level player (MLB Stats API model).
Bat runs|Batting runs|Runs added by hitting alone, relative to average.
BsR|Baserunning runs|Runs added by stealing, taking extra bases and avoiding outs on the bases.
Fld runs|Fielding runs|Runs saved or cost by defense compared to average at the position.
xBA|Expected batting average|Average the batted balls should have produced based on exit velocity and launch angle.
pit:xBA|Expected batting average against|Average opponents should have hit given the quality of contact allowed.
xSLG|Expected slugging|Slugging the batted balls should have produced based on contact quality.
pit:xSLG|Expected slugging against|Slugging opponents should have produced given the contact allowed.
xwOBA|Expected wOBA|wOBA the quality of contact and strikeouts/walks should have produced, ignoring defense and luck.
xOBP|Expected on-base percentage|On-base percentage implied by contact quality, walks and strikeouts.
xISO|Expected isolated power|Power implied by contact quality.
xwOBAcon|Expected wOBA on contact|Expected wOBA counting only balls put in play.
wOBA−xwOBA|wOBA minus expected wOBA|Positive: results ran ahead of the contact quality (lucky or fast). Negative: unlucky.
Avg EV|Average exit velocity|Mean speed of the ball off the bat, in mph.
EV50|Exit velocity, hardest half|Average speed of the hardest 50% of batted balls.
Avg LA|Average launch angle|Mean vertical angle of batted balls, in degrees.
Sweet-spot%|Sweet-spot rate|Share of batted balls hit at a launch angle of 8 to 32 degrees.
Barrel%|Barrel rate|Share of batted balls with the ideal combination of speed and angle, the ones that most often become extra-base hits.
Hard-hit%|Hard-hit rate|Share of batted balls hit 95 mph or harder.
K%|Strikeout rate|Share of plate appearances ending in a strikeout.
BB%|Walk rate|Share of plate appearances ending in a walk.
Whiff%|Whiff rate|Swings that miss, per swing.
Swing%|Swing rate|Share of all pitches the batter swings at.
Z-Swing%|Zone swing rate|Swing rate on pitches inside the strike zone.
Chase%|Chase rate|Swing rate on pitches outside the strike zone (O-Swing%).
Z-Contact%|Zone contact rate|Contact made on swings at pitches in the strike zone.
O-Contact%|Chase contact rate|Contact made on swings at pitches outside the zone.
Zone%|Zone rate|Share of pitches that land in the strike zone.
Edge%|Edge rate|Share of pitches on the borderline of the strike zone.
Meatball Swing%|Meatball swing rate|Swing rate on pitches right down the middle.
GB%|Ground-ball rate|Share of batted balls that are ground balls.
LD%|Line-drive rate|Share of batted balls that are line drives.
FB%|Fly-ball rate|Share of batted balls that are fly balls.
PU%|Pop-up rate|Share of batted balls that are infield pop-ups.
Pull%|Pull rate|Share of batted balls hit to the pull side.
Straight%|Center rate|Share of batted balls hit up the middle.
Oppo%|Opposite-field rate|Share of batted balls hit to the opposite field.
Bat speed|Average bat speed|Speed of the sweet spot of the bat at contact, in mph (tracked from 2023).
Fast-swing%|Fast-swing rate|Share of swings at 75 mph bat speed or faster.
Squared-up%|Squared-up rate|Share of swings that make solid contact with the ball.
Blast%|Blast rate|Share of swings that are both squared up and fast.
Swing length|Swing length|Average distance the bat head travels during the swing, in feet.
Sprint speed|Sprint speed|Feet per second in the player's fastest one-second window on competitive runs.
Bolts|Bolts|Competitive runs at 30 feet per second or faster.
OAA|Outs above average|Outs a fielder makes beyond what an average fielder would on the same plays.
Fld runs prev.|Fielding runs, prior season|Last season's fielding runs, shown for context.
GS|Games started|Games the pitcher started.
IP|Innings pitched|Innings the pitcher was on the mound. Written with thirds: 6.1 is six and one third.
W|Wins|Games credited as a win to the pitcher.
tbat,tpit:W|Wins|Games the team won.
L|Losses|Games credited as a loss to the pitcher.
tbat,tpit:L|Losses|Games the team lost.
SV|Saves|Games finished while protecting a close lead.
HLD|Holds|Relief appearances that preserve a lead without finishing the game.
BF|Batters faced|Total plate appearances against the pitcher.
ER|Earned runs|Runs that scored without the help of an error.
Pitches|Pitches thrown|Total pitches thrown.
ERA|Earned run average|Earned runs allowed per nine innings.
WHIP|Walks plus hits per inning|Baserunners allowed by walk or hit, per inning pitched.
FIP|Fielding independent pitching|ERA-scale estimate using only strikeouts, walks, hit-by-pitches and home runs.
xFIP|Expected FIP|FIP with home runs replaced by the league-average rate per fly ball.
xERA|Expected ERA|ERA the quality of contact allowed should have produced.
ERA-|ERA minus|ERA relative to the league, park-adjusted. 100 is average and lower is better.
FIP-|FIP minus|FIP relative to the league, park-adjusted. 100 is average and lower is better.
RA9-WAR|Runs-allowed WAR|Wins above replacement built on runs allowed per nine, instead of FIP.
K/9|Strikeouts per nine|Strikeouts per nine innings pitched.
BB/9|Walks per nine|Walks per nine innings pitched.
HR/9|Home runs per nine|Home runs allowed per nine innings pitched.
K−BB%|Strikeout minus walk rate|K% minus BB%, one of the best quick predictors of pitcher skill.
LOB%|Left-on-base rate|Share of baserunners who do not score. Extreme values tend to regress.
AVG against|Batting average against|Opponents' batting average against the pitcher or staff.
OBP against|On-base percentage against|Opponents' OBP against the pitcher or staff.
SLG against|Slugging against|Opponents' slugging against the pitcher or staff.
OPS against|OPS against|Opponents' OBP plus SLG against the pitcher or staff.
wOBA against|wOBA against|Opponents' weighted on-base average against the pitcher or staff.
EV allowed|Exit velocity allowed|Average exit velocity of batted balls against the pitcher, in mph.
LA allowed|Launch angle allowed|Average launch angle of batted balls against the pitcher, in degrees.
Fastball velo|Fastball velocity|Average speed of the four-seam fastball (or sinker), in mph.
F-Strike%|First-pitch strike rate|Share of plate appearances that start with a strike.
W%|Winning percentage|Wins divided by games played.
RS|Runs scored|Total runs the team scored.
RA|Runs allowed|Total runs the team allowed.
Run diff|Run differential|Runs scored minus runs allowed.
Pythag W%|Pythagorean winning percentage|Winning percentage expected from runs scored and allowed.
R/G|Runs per game|Runs scored per game.
RA/G|Runs allowed per game|Runs allowed per game.
`);

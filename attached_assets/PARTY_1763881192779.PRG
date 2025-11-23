IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 

Local oForm
oForm = CREATEOBJECT("TopForm2")
oForm.show()
_screen.Visible = .F. && Hide Screen

SET CONFIRM ON 
sele PARTY
SET ORDER TO PNAME
IF SUPP=.T.
	SET FILTER TO AGCODE=TAGCODE
ENDIF 
SCAT MEMV BLANK

DEFINE WINDOW SALM2 from 5,19 to 17,63 NONE SHAD;
COLOR W+/R+,W+/N+ FONT 'Consolas',15 STYLE "B" IN WINDOW form1
ACTIVATE WINDOW SALM2

HIDE WINDOW SALM2
defi popu find from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Supplier Name",35)+" "+padc("City",15)+" "+padc("Agent",10) prom fiel padr(Pname,35)+"|"+PADR(CITY,15)+"|"+PADR(AGENT,10) FONT 'Consolas',15 STYLE "B" 
ACTI WINDOW SALM2

do disp
CLEA GETS
do true with "PARTY.prg"
RELEASE WINDOW SALM2
SELECT PARTY
SET FILTER TO
IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 

RETURN 

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm2 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Party Master"
FontName = 'Consolas'
FontSize = 17
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC
ENDDEFINE


proc disp
@ 0,0 SAY PADC("PARTY MASTER",44) COLO W+/N+
@ 2,1 SAY "Code :" GET m.Pcode when .f.
@ 3,1 SAY "Name :" GET m.Pname PICT "@K" vali !empt(m.Pname)
@ 4,1 SAY "Add  :" GET m.add1 PICT "@K"
@ 5,1 SAY "City :" GET m.city PICT "@K" 
@ 6,1 SAY "State:" GET m.state PICT "@K" VALI CHKSTATE()
@ 7,1 SAY "GstNo:" GET m.tin PICT "@K"
@ 8,1 SAY "PH   :" GET m.phone PICT "@K"
*@10,1 SAY "AGENT:" GET m.AGENT SIZE 1,25 VALI CHKAGENT() PICT "@K"
*@10,34 GET m.AGCODE SIZE 1,3 PICT "@K" WHEN M.AGCODE=0
*@10,1 SAY "OPENING AMOUNT:" GET m.OPENING SIZE 1,10,2 PICT "@K"
@10,1 SAY "OP-DEBIT:" GET m.OPDEBIT SIZE 1,10,2 PICT "@K"
@10,22 SAY "OP-CREDIT:" GET m.OPCREDIT SIZE 1,10,2 PICT "@K"
@12,13 GET save ;
	PICTURE "@*HT Save;Cancel" ;
	SIZE 1,8,1 ;
	DEFAULT 1
retu

proc clr
scatter memvar  blank
save = 2
SELE PARTY
SET FILTER TO 
SET ORDE TO PCODE
GO BOTT
M.PCODE=PARTY.PCODE+1
show gets
retu

proc chkc
para cc
if baar=2
	retu 1
endi
seek cc
if found()
	wait wind "Code Already Exist" nowa
	retu 0
endi
retu



proc chkqty
m.opstock=m.pack*m.pcs
show gets
retu



PROCEDURE CHKAGENT
SELECT PARTY 
SET FILTER TO 
M.AGCODE=0
sele agent,AGCODE from party into curs tag grou by ageNt
sele tag
IF !EMPTY(M.AGENT)
	SELECT TAG
	SET FILTER TO 
	SET FILTER TO ALLTRIM(AGENT)=ALLTRIM(M.AGENT)
ENDIF 
defi popu finda from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Agent",30) prom fiel padr(agent,35) FONT 'Consolas',15 STYLE "B" 
on sele popu finda do selag
acti popu finda REST 
sele PARTY
retu



proc selag
m.agent=tag.agent
M.AGCODE=TAG.AGCODE
show gets
deac popu finda
RETURN



PROCEDURE CHKSTATE
IF USED("STATE")
	SELECT STATE
	USE
ENDI 
IF !USED("STATE")
	SELECT 0
	USE STATE
ENDI 

SELECT STATE 
sele NAME,CODE from STATE into curs TSTA grou by NAME
sele TSTA
IF !EMPTY(M.STATE)
	SELECT TSTA
	SET FILTER TO 
	SET FILTER TO ALLTRIM(NAME)=ALLTRIM(M.STATE)
ENDIF 
defi popu Xfinda from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("STATE",30) prom fiel padr(NAME,35) FONT 'Consolas',15 STYLE "B" 
on sele popu Xfinda do selST
acti popu Xfinda REST 
IF USED("STATE")
	SELECT STATE
	USE
ENDI 
IF EMPTY(M.STATE)
	WAIT WINDOW "ENTER STATE" NOWAIT 
	RETURN 0
ENDIF 
sele PARTY
retu



proc selST
m.STATE=TSTA.NAME
M.STCODE=TSTA.CODE
show gets
deac popu Xfinda
RETURN

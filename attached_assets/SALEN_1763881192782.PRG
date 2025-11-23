IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF USED("SALMAS")
	SELECT SALMAS
	USE
ENDI 
IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 

IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 

IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 
IF USED("PUR")
	SELECT PUR
	USE
ENDI 

IF !USED("PUR")
	SELECT 0
	USE PUR
ENDI 

IF !USED("PAYMENT")
	SELECT 0
	USE PAYMENT
ENDI 

IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 

IF !USED("SALMAS")
	SELECT 0
	USE SALMAS
ENDI 

IF !USED("MAINSALE")
	SELECT 0
	USE DATA\MAINSALE
ENDI 

IF !USED("SALE")
	SELECT 0
	USE DATA\SALE
ENDI 

IF !USED("PURCHASE")
	SELECT 0
	USE PURCHASE
ENDI 

Local oForm
oForm = CREATEOBJECT("TopForm1")
oForm.show()
_screen.Visible = .F. && Hide Screen

SET CONFIRM ON 
sele SALMAS
set orde to code1
LKEY=.F.
dime db(50)
PEDIT=.F.
ON KEY LABEL CTRL+E DO PAEDIT 
TPBAL=0
TPDET=SPACE(30)
*TOPEN=0
TCHA=0.00
TADD=0.00
TLES=0.00
tmtr=0.00

NOPRINT=.F.
PCREDIT=0
PDEBIT=0
PPUR=0
PPAY=0
tdate=DATE()
TCOMPANY=0
XTTYPE="NEW"
XTINVNO=0
TBAR=.F.
TBARQ=.F.
IF !EMPTY(XTBILLX)
	XTBILL=XTBILLX
ELSE
	XTBILL='EST'
ENDIF 
tcustcode=180000
TMOB=0
TTINNO=""
tcustname=spac(30)
tcustaddr=spac(30)
tcustcity=spac(30)
tMOBILE=spac(15)
tSTATE=spac(35)
tSTCODE=spac(3)
tTINNO=spac(30)
TAGE="ALL"
tAGENT=spac(30)
XSAVE=1
XWBILL="RP"
DEFINE WINDOW XX from 5,15 to 13,80 COLO W+/R+,W+/N+ FONT 'Consolas',17 STYLE "B" IN WINDOW FORM1
ACTI WIND XX 
@ 1,1 SAY "TYPE  :" GET XTTYPE PICT "@MK NEW,OLD,CAN,DEL" 
@ 1,14 GET TDATE WHEN XTTYPE="NEW"  VALI CHKTDT()
@ 1,26 GET XTBILL PICT "@MK EST,GST" VALI CHKXB()
@ 1,50 GET XWBILL PICT "@MK RP,W" WHEN XTBILL="TAX"
@ 1,30 SAY "BILL NO :" GET XTINVNO VALI CHKINV() WHEN ALLT(XTTYPE)#"NEW" SIZE 1,5 pict "@K"
*@ 3,1 SAY "AGENT :" GET TAGE PICT "@KM ALL,AGN" WHEN (SUPP=.F. AND ALLT(XTTYPE)="NEW") OR (SUPP=.F. AND ALLT(XTTYPE)="OLD" AND PEDIT=.T.)
*@ 3,14  GET TAGENT SIZE 1,25 VALI CHKAGENT() WHEN TAGE="AGN" AND SUPP=.F. pict "@K"
@ 3,1 SAY "PARTY :" GET TCUSTNAME VALI CHKPARTY() SIZE 1,30 pict "@K"  WHEN (ALLT(XTTYPE)="NEW" AND ALLTRIM(XWBILL)="W" AND XTBILL="TAX") OR PEDIT=.T. 
@ 5,13 GET Xsave ;
	PICTURE "@*HT Save;Cancel" ;
	SIZE 1,8,1 ;
	DEFAULT 1
READ
if last()=27 OR XSAVE=2
	RELE WIND XX
		IF USED("PURCHASE")
			SELECT PURCHASE
			USE
		ENDI 
		IF USED("PUR")
			SELECT PUR
			USE
		ENDI 


		IF USED("PARTY")
			SELECT PARTY
			USE	
		ENDI 
		IF USED("SALMAS")
			SELECT SALMAS
			USE
		ENDI 
		IF USED("MAINSALE")
			SELECT MAINSALE
			USE
		ENDI 
		IF USED("SALE")
			SELECT SALE
			USE
		ENDI 
		IF USED("PAYMENT")
			SELECT PAYMENT
			USE
		ENDI 

	RETURN 
ENDI
RELE WIND XX
XTBILLX=XTBILL
PEDIT=.F.
IF ALLTRIM(XTTYPE)="DEL"
	NANSWER=MESSAGEBOX("DO YOU WANT TO DELETE THE BILL NUMBER :  "+ALLTRIM(STR(XTINVNO)),4,"POS")
	IF NANSWER=6
		SELECT MAINSALE
		DELETE FOR DATE>=FINALDATE AND DATE<=FINALDATE1 AND INVNO=XTINVNO AND COMPANY=TCOMPANY
		SELECT SALE 
		DELETE FOR DATE>=FINALDATE AND DATE<=FINALDATE1 AND INVNO=XTINVNO AND COMPANY=TCOMPANY
		MESSAGEBOX("RECORD DELETED SUCESSFULLY",0,"POS")
		IF USED("PARTY")
			SELECT PARTY
			USE
		ENDI 
		IF USED("SALMAS")
			SELECT SALMAS
			USE
		ENDI 
		IF USED("MAINSALE")
			SELECT MAINSALE
			USE
		ENDI 
		IF USED("SALE")
			SELECT SALE
			USE
		ENDI 
		
		IF USED("PAYMENT")
			SELECT PAYMENT
			USE
		ENDI 

		IF USED("PUR")
			SELECT PUR
			USE
		ENDI 

	
		IF USED("PURCHASE")
			SELECT PURCHASE
			USE
		ENDI 
	ENDIF 
	RETURN 
ENDIF 

*@0,0 say padc(" B I L L I N G",85) colo gr+/B+ FONT 'Consolas',16 STYLE "B"
*DEFINE WINDOW BMAIN FROM 0,0 TO 40,100 COLO W+/N+ FONT 'Consolas',14 STYLE "B" IN WINDOW Form1
*ACTIVATE WINDOW bmain


TAMTS=0

RATECOL=.F.
TQ=0
TSALESMAN=0
TDIS=0.00
TCCNO=0
XTOT1=0
DISCCOMP=0
XTOT2=0
TNAME1=SPAC(15)
XAPR=0
XAPRDATE={  -  -    }

ON KEY LABEL F5 DO ITEMLIST
ON KEY LABEL F6 DO ITEMPUR
on key label f7 do park
on key label f8 do parkr
*ON KEY LABEL F2 DO WBILL
*ON KEY LABEL F2 DO PENDING
*ON KEY LABEL F2 DO APPRTRANS

ON KEY LABEL F3 DO CCR
*ON KEY LABEL F3 DO DISENT
*ON KEY LABEL F6 DO CANCBILL
*ON KEY LABEL F1 DO RETUGATH
*ON KEY LABEL CTRL+R DO RATECOL


PENDING=.F.

BILLCONT=.T.
RW="1"
EDT=.F.
lessfound=.f.
LESSRECN=0
DISCFOUND=0
set safe off
set conf on
set curs on
set exac on
TGIVEN=0.00
TRETURN=0.00

TBYCARD=0.00
TBYCASH=0.00

EXC=.F.
RET=.F.
PUBL CANCL,TINCTAX,TSTKCHK,STKBAL,TBAL,TBAL1
TITSEL=.F.
STKBAL=.F.
TBAL=0
TBAL1=0
TSTKCHK=LDATE.BILLLOCK 
IF XWBILL="RP"
	TINCTAX=.T.
ELSE
	TINCTAX=.F.
ENDIF 
CANCL=.F.
sele 20
use
REVV=.F.
NEG=.F.
SELE 14
USE
sele mainsale
temm='TEMP\tmains.dbf'

copy stru to TEMP\tmain WITH CDX
SELE 14
USE
USE TEMP\TMAIN
SELE MAINSALE

dsale=0

******Variables
IF XTTYPE="NEW"
	SET FILT TO DATE>=FINALDATE AND DATE<=FINALDATE1 AND COMPANY=TCOMPANY
	set order to invno
	go bott
	tinvno=invno+1
	SET FILT TO
ELSE 
	tinvno=XTinvno
ENDIF


PUBL GCODE
gcode=""
trate=0
tsqty=0
tot=0
TSIZE=0.00
gt=0
TRATE=0.00
TTYPE=1
parkinvno=tinvno

parkdate=tdate

TBX=allt(str(tinvno))

DIMENSION  ab(10)
DIMENSION  Xcd(10)
for ix=1 to 10
	ab(ix)=0
	Xcd(ix)=0
endf

sele mainsale
******
ON KEY LABEL F9 DO EXC
ON KEY LABEL F10 DO RET

on key labe f11 do CUST
on key labe f12 do deli

DO CASE
	CASE XTBILL="EST"
		defi wind purmain from 1,1 to 30,90 colo w+/N+,W+/N+,w+/w+,w+/w+ FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1 
		acti wind purmain 
	CASE XTBILL="GST"
		defi wind purmain from 1,1 to 30,90 colo w+/RB+,W+/RB+,w+/w+,w+/w+ FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1 
		acti wind purmain 
	CASE XTBILL="TAX"
		defi wind purmain from 1,1 to 30,90 colo w+/GB+,W+/GB+,w+/w+,w+/w+ FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1 
		acti wind purmain 
ENDC 
*DO DAYTOT
*DO AMTRET
**********

IF PARK=.T.
	@ 5,15 SAY PADC('BILL PARKED FOR RS.'+ALLT(STR(PARKAMT,10,2)),49) COLO W+*/N+ 
ENDI
**********
@ 5,1 SAY PADR('F7-PARK',7) COLO GR+/N+
@ 5,65 SAY PADL('F8-RETURN PARK',14) COLO GR+/N+

@26,0 say padr('F12-Ttem Delete,0-Cancel,Dot(.)-Save & Print,(*)-Save & Exit,F9-Exc,F5-Item List,F3-Card Bill',94) colo gr+/N+ FONT 'CONSOLAS',14 STYLE "B"

IF !EMPTY(ALLTRIM(TCUSTNAME))
	@28,0 SAY ALLTRIM(TCUSTNAME)+"-"+ALLTRIM(TCUSTCITY)+"    "+ALLTRIM(TPDET) colo r+/N+ FONT 'CONSOLAS',13 STYLE "B"
ENDIF 
*FONT 'Consolas',16 STYLE "B" colo gr+/N+ 

*@ 1,1 SAY "SILK'S:" GET TB1 SIZE 1,7 WHEN .F.

*@ 1,1 SAY "BILL NO:" GET TB2 SIZE 1,7 WHEN .F.

@ 1,1 SAY "BILL NO:" GET TBX SIZE 1,7 WHEN .F. FONT 'Consolas',16 STYLE "B"

@ 1,28 say "Date :" get tdate when .f. FONT 'Consolas',16 STYLE "B"
@ 1,55 say "F11-->Customer"
@ 3,1 get tcustname size 0,0
@ 3,42 get tcustcity  vali chkentno() size 0,0
keyb "{enter}"
keyb "{enter}"
*@ 1,77 SAY "R" 
@ 0,0 to 3,124 doub COLO GB+
sele 15
use
sele SALE
temfile='TEMP\tbi.dbf'
IF XTTYPE="NEW"
	COPY stru to (temfile) with cdx FOR DATE>=FINALDATE AND DATE<=FINALDATE1 AND INVNO=TINVNO AND COMPANY=TCOMPANY 
ELSE
	COPY to (temfile) with cdx FOR DATE>=FINALDATE AND DATE<=FINALDATE1 AND INVNO=TINVNO AND COMPANY=TCOMPANY
ENDI
sele 15
use (temfile) alias temsal
sele temsal
IF ALLTRIM(XTTYPE)="CAN"
	REPLACE ALL QTY WITH QTY*-1,AMOUNT WITH AMOUNT*-1
ENDIF 

defi popu pur from 6,0 to 15,113 COLO W+/N+,W+/N+,GB+/N+,W+/N+,W+/N+,N+/W+ prom fiel ;
IIF(ALLT(NAME)#"NEW",str(recno(),4)+"|"+PADR(BARID,7)+"|"+PADR(ALLTRIM(NAME),30)+"|"+STR(RATE,8,2)+"|"+padr(size,6)+"|"+str(qty,4)+"|"+str(amount,8,2),;
PADC("*-*-*-*-*-*-*-*-*-*-N-E-W--E-N-T-R-Y*-*-*-*-*-*-*-*-*-*-",77))  FONT 'CONSOLAS',16 STYLE "B" IN WINDOW PURMAIN 
on sele popu pur do selpur
show popu pur
READ
contt=1
do while contt=1
if last()#27
	SELECT TEMSAL
	keyb "{END}"
	acti popu pur
else
	SELE TEMSAL
	COUNT for Qty>0 TO A
	if a=0
		sele mainsale
		set filt to
		SELE SALMAS
		SET FILT TO
		rele wind purmain
		RELE wind bmain 

		IF USED("PURCHASE")
			SELECT PURCHASE
			USE
		ENDI 
		IF USED("PUR")
			SELECT PUR
			USE
		ENDI 


		IF USED("PARTY")
			SELECT PARTY
			USE	
		ENDI 
		IF USED("SALMAS")
			SELECT SALMAS
			USE
		ENDI 
		IF USED("MAINSALE")
			SELECT MAINSALE
			USE
		ENDI 
		IF USED("SALE")
			SELECT SALE
			USE
		ENDI 
		IF USED("PAYMENT")
			SELECT PAYMENT
			USE
		ENDI 
		SELECT TEMSAL
		RETURN 
	endi	
endi

savv=0
canl=0
contt=0
savvc=0
DO CASE
	CASE GCODE='.'
		SAVV=1
	CASE GCODE='0'
		CANL=1
	CASE GCODE='*'
		savvc=1
		SAVV=1
ENDC
contt=0
if savv#1 
	SELECT TEMSAL
	defi wind save from 10,20 to 14,82 COLO W+/G+ FONT 'CONSOLAS',16 STYLE "B"  IN WINDOW Form1 
	ACTIVATE WINDOW SAVE 
	do while savv=0 and canl=0 and contt=0 AND savvc=0 AND LESSFOUND=.F.
		@ 1,2 get contt pict "@*HT \<1.Contine"	
		@ 1,15 get canl pict "@*HT \<2.Cancel"
		@ 1,25 get savv pict "@*HT \<3.Save->Print"
		@ 1,40 get savvc pict "@*HT \<4.Save->Exit"
		read
	endd
	if contt=1
		rele wind save
	endi
	if savvc=1
		savv=1
		NOPRINT=.T.
		rele wind save
	endi
endi
endd
if ldate.gr=.t. 
	*********
	PRNN=1
	PRNNX=1

	IF SAVV=1 
		IF XWBILL="RP"
			DO custn
		ENDIF 
		*IF NOPRINT=.T. 
		*	TGIVEN=GT
		*	TBYCARD=GT
		*	TBYCASH=0
			*KEYBOARD '{ENTER}' 
			*KEYBOARD '{ENTER}' 
			*KEYBOARD '{ENTER}' 
		*ENDIF 
		on key
		DO WHILE TGIVEN<GT OR LAST()=27 OR (TGIVEN=0 AND GT>0)
			defi wind XYZ from 6,25 to 22,65 shad colo W+/G+,W+/R+ DOUB FONT 'CONSOLAS',17 STYLE "B" IN WINDOW Form1
			acti wind XYZ
			@ 2,1 SAY "GIVEN AMOUNT :" GET TGIVEN VALI CHKGIVEN() SIZE 1,9,2 pict "@K"
			@ 4,1 SAY "BALANCE      :" GET TRETURN WHEN .F. SIZE 1,9,2 
			@ 6,1 SAY "BY CARD      :" GET TBYCARD VALI CHKBYCARD() SIZE 1,9,2 pict "@K" WHEN XTBILL="GST"
			@ 8,1 SAY "BY CASH      :" GET TBYCASH WHEN .F. SIZE 1,9,2 
			@ 10,5 GET PRNN PICT "@*ht PRINT;CANCEL" 
			READ
			IF PRNN=2 OR GT=0
				EXIT
			ENDI
		ENDD
		RELE WIND XYZ
	ENDIF 
	TRETURN=TGIVEN-GT
*******
Endi

if savv=1 and last()#27 and iif(ldate.gr=.t.,PRNN=1 AND TGIVEN>=GT,.t.)
	DO CASE 
		CASE XTBILL="EST"
			TCOMPANY=3
		CASE XTBILL="GST"
			TCOMPANY=1
		CASE XTBILL="TAX"
			TCOMPANY=2
	ENDCASE 

	SELE TEMSAL
	REPL ALL COMPANY WITH TCOMPANY
	COUNT TO A 
	IF A>1 
		sele temsal
		DELE FOR empt(code)	AND EMPT(AMOUNT)
		repl all date with tdate,custcode with tcustcode,CODE1 WITH VAL(CODE)
		IF TCOMPANY=1
			REPLACE ALL FCODE WITH TCOM
		ENDIF 
		IF TCOMPANY=2
			REPLACE ALL FCODE WITH TCOM1
		ENDIF 
		IF TCOMPANY=3
			REPLACE ALL FCODE WITH TCOM2
		ENDIF 
			IF TINCTAX=.F.
				REPLACE ALL CGST WITH QTY*RATE*CTAX FOR TYPE='P' OR TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SGST WITH QTY*RATE*STAX FOR TYPE='P' OR TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SALVAL WITH QTY*RATE FOR TYPE='P' OR TYPE='S' OR EMPT(TYPE)

				REPLACE ALL CGST WITH RATE*CTAX FOR  TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SGST WITH RATE*STAX FOR  TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SALVAL WITH RATE FOR TYPE='S' OR EMPT(TYPE)

				
				REPLACE ALL CGST WITH QTY*VAL(SIZE)*RATE*CTAX FOR TYPE='M'
				REPLACE ALL SGST WITH QTY*VAL(SIZE)*RATE*STAX FOR TYPE='M'
				REPLACE ALL SALVAL WITH QTY*VAL(SIZE)*RATE FOR TYPE='M'
				REPLACE ALL SALTAX WITH CGST+SGST
			ELSE
				REPLACE ALL CGST WITH (QTY*RATE-(QTY*RATE/(CTAX+STAX+1)))/2 FOR TYPE='P' OR TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SGST WITH (QTY*RATE-(QTY*RATE/(CTAX+STAX+1)))/2 FOR TYPE='P' OR TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SALVAL WITH (QTY*RATE/(CTAX+STAX+1)) FOR TYPE='P' OR TYPE='S' OR EMPT(TYPE)  

				REPLACE ALL CGST WITH (RATE-(RATE/(CTAX+STAX+1)))/2 FOR  TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SGST WITH (RATE-(RATE/(CTAX+STAX+1)))/2 FOR  TYPE='S' OR EMPT(TYPE)
				REPLACE ALL SALVAL WITH (RATE/(CTAX+STAX+1)) FOR TYPE='S' OR EMPT(TYPE)  

				
				REPLACE ALL CGST WITH (QTY*VAL(SIZE)*RATE-(QTY*VAL(SIZE)*RATE/(CTAX+STAX+1)))/2 FOR TYPE='M'
				REPLACE ALL SGST WITH (QTY*VAL(SIZE)*RATE-(QTY*VAL(SIZE)*RATE/(CTAX+STAX+1)))/2 FOR TYPE='M'
				REPLACE ALL SALVAL WITH (QTY*VAL(SIZE)*RATE/(CTAX+STAX+1)) FOR TYPE='M'
				REPLACE ALL SALTAX WITH CGST+SGST 
			ENDIF 
	ENDI
	SELECT TEMSAL
	REPLACE ALL QTY WITH 0 FOR QTY<0
	GO TOP
	SUM AMOUNT,QTY TO TOTA,TOTQ
	SUM CGST,SGST TO CG,SG 
	if tota#0
		sele mainsale
		scat memv blank
		m.invno=tinvno
		m.date=tdate
		m.custcode=tcustcode
		m.custname=tcustname
		m.custaddr=tcustaddr
		m.custcity=ALLTRIM(TCUSTCITY)
		M.MOBILE=TMOB
		M.STATE=TSTATE
		M.STCODE=TSTCODE
		IF VAL(M.STCODE)=33 OR VAL(M.STCODE)=0
			M.GSTTYPE=1
		ELSE
			M.GSTTYPE=2
		ENDI
		M.AGENT=TAGENT
		M.TIN=TTINNO
		m.time=time()
		M.CASHIER=TCASH
		M.BILLER=TBILL
		m.type=ttype
		m.edate=date()
		M.TQTY=TOTQ
		M.PBAL=TPBAL
		M.INCTAX=TINCTAX		
		IF TCOMPANY=1
			M.FCODE=TCOM
		ENDIF 
		IF TCOMPANY=2
			M.FCODE=TCOM1
		ENDIF 	
		IF TCOMPANY=3
			M.FCODE=TCOM2
		ENDIF 	

			IF TINCTAX=.F.
				m.amount=TOTA+CG+SG
				M.ROF=ROUND(M.AMOUNT,0)-M.AMOUNT
				m.gtot=M.AMOUNT+M.ROF
				M.SALEVALUE=TOTA
				M.TAXVALUE=CG+SG
			ELSE
				m.amount=TOTA
				M.ROF=ROUND(M.AMOUNT,0)-M.AMOUNT
				m.gtot=M.AMOUNT+M.ROF
				M.SALEVALUE=TOTA-(CG+SG)
				M.TAXVALUE=CG+SG
			ENDIF 
		*if wbill=.f.
		*	m.fcode=tcom
		*else
		*	m.fcode='D'
		*ENDI
		
		IF PENDING=.T.
			M.CANCEL=.T.
			M.CUSTCITY="PENDING"
		ENDI
		M.COMPANY=TCOMPANY
		M.CNO=TCNO
		M.CCNO=TCCNO
		M.RCNO=TCCNO
		
		M.BYCARD=TBYCARD
		M.BYCASH=TBYCASH
			
		if ldate.gr=.t.
		*******
			M.GIVEN=TGIVEN
			M.RETURN=TRETURN
		*******
		endi

		DO WHILE FLOCK("MAINSALE")
			IF XTTYPE="NEW" OR XTTYPE="CAN"
				SELECT MAINSALE 
				SET FILTER TO DATE>=FINALDATE AND DATE<=FINALDATE1 AND COMPANY=TCOMPANY
				SET ORDER TO INVNO
				GO BOTT
				M.INVNO=INVNO+1
			ELSE
				DELETE FOR DATE>=FINALDATE AND DATE<=FINALDATE1 AND INVNO=TINVNO AND COMPANY=TCOMPANY
				M.INVNO=TINVNO
			ENDIF 
		    M.MAC=MACHINEID	
			M.NAME1=TNAME1
			M.COMPANY=TCOMPANY
			TINVNO=M.INVNO
			APPE BLANK
			gath memv
			FLUSH
			UNLOCK IN MAINSALE
			exit
		ENDDO


		SELE TMAIN
		APPE BLANK
		gath memv
		FLUSH

		SELE TEMSAL
		REPL ALL INVNO WITH TINVNO FOR COMPANY=TCOMPANY
		REPLACE ALL MOBILE WITH TMOB
		FLUSH
		sele SALE
		IF XTTYPE#"NEW"
			DELETE FOR DATE>=FINALDATE AND DATE<=FINALDATE1 AND INVNO=TINVNO AND COMPANY=TCOMPANY
		ENDIF 
		appe from (temfile) for !empt(NAME) and !empt(code) AND COMPANY=TCOMPANY
		FLUSH
		****STOCK UPDATE
		SELECT VAL(BARID) AS SERIAL,SUM(QTY) AS QTY FROM SALE WHERE DATE=TDATE AND INVNO=TINVNO AND COMPANY=TCOMPANY INTO CURSOR TSTKK GROUP BY BARID 
		SELECT TSTKK
		SCAN
			SELECT PUR
			SET ORDER TO SERIAL
			SEEK TSTKK.SERIAL
			IF FOUND()
				DO WHILE RLOCK("PUR")
					SELECT PUR
					REPLACE SALEQTY WITH SALEQTY+TSTKK.QTY
					REPLACE STOCKQTY WITH QTY-SALEQTY-DQTY
					UNLOCK IN PUR
					EXIT
				ENDD
			ENDIF 
			SELECT TSTKK
		ENDSCAN 		
		************
		*DO DBFOPEN
		*DO DBFCLOSE
		XGIVEN=TGIVEN
		XRETURN=TRETURN
		XAMT=GT
	   	IF NOPRINT=.F.
		   	DO INVREP WITH 2,TINVNO,XTBILL,TCOMPANY
		ENDIF  
	else
		wait wind "No Entries Found...!" nowa
	endi
endi
rele wind save,purmain,BMAIN
*on key
IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 
IF USED("PUR")
	SELECT PUR
	USE
ENDI 


IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF USED("SALMAS")
	SELECT SALMAS
	USE
ENDI 
IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 
IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 

IF BILLCONT=.T.
	keyb '{enter}'
	keyb '{enter}'
	keyb '{enter}'
	IF TTYPE#2
		*keyb '{enter}'
		keyb '{enter}'
		keyb '{enter}'
		keyb '{enter}'
		IF XTBILL='GST' 
			*keyb '{enter}'
		ENDIF 
	ENDIF 
ENDIF 
retu

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
ALWAYSONTOP=.F.
Name = "Form1"
Caption =  "BILLING"
FontName = 'Consolas'
FontSize = 15
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC

ENDDEFINE



proc selpur
if empt(name)
	scat memv blank
else
	scat memv
	if allt(m.name)="NEW"
		M.NAME=SPAC(35)
		IF (RET=.F. OR EXC=.F.) AND (LEN(ALLT(M.BARID))=16 OR LEN(ALLT(M.BARID))=14)
			M.QTY=1
		ELSE
			M.QTY=0
		ENDI
		EDT=.F.
	ELSE
		if lessfound=.t. 
		*AND RECN()<LESSRECN
			do lessfound
			SELECT TEMSAL
			RETU 
		endi
		EDT=.T.
	ENDI
	show gets
endi
*M.SALESMAN=TSALESMAN

IF !EMPT(M.SIZE)
	TSIZE=VAL(M.SIZE)
	SHOW GETS
ENDI

@ 3,1 SAY PADC("BARCODE",11) COLO W+ FONT 'Consolas',16 STYLE "B"
@ 3,13 say padc("Particulars",35) colo w+ FONT 'Consolas',16 STYLE "B"
@ 3,50 SAY PADC("Rate",8) colo w+ FONT 'Consolas',16 STYLE "B"
*@ 3,59 SAY PADC("Dis%",4) colo w+
*@ 3,44 say padc("Value",8) colo w+
@ 3,63 say padc("Size",6) colo w+ FONT 'Consolas',16 STYLE "B"
@ 3,78 say padc("Qty",4) colo w+ FONT 'Consolas',16 STYLE "B"
@ 3,84 say padc("Amount",8) colo w+ FONT 'Consolas',16 STYLE "B"
*@ 3,92 say padc("Stf",3) colo w+ FONT 'Consolas',16 STYLE "B"

@ 4,1 get m.barid size 1,25 pict "@!K" VALI CHKBAR()  FONT 'CONSOLAS',17 STYLE "B" COLO w+/R+,W+/R+,w+/w+,w+/w+
@ 4,8 get m.code size 1,7 pict "@K"  vali chkcode()   FONT 'CONSOLAS',17 STYLE "B"
*colo B/B,N/N,X/X,X/X
@ 4,13 get m.name SIZE 1,35 WHEN M.CODE="120" PICT "@!K" FONT 'CONSOLAS',17 STYLE "B"
@ 4,50 get m.rate size 1,8,2  VALI CHKR() when (salmas.type#'S' AND (LEN(ALLT(M.BARID))<7)) OR EDT=.T.  PICT "@!KZ"  FONT 'CONSOLAS',17 STYLE "B"
*@ 4,55 get m.disc size 1,4,0 pict "@z" VALI CHKDISCR() WHEN LDATE.AADI=.T.
*@ 4,53 get m.size size 1,6 valid !empty(m.size) erro 'Enter Size....' when (salmas.type#'S' and (ldate.size OR LEN(ALLT(M.BARID))<=3) and salmas.type#'M')   PICT "@Z" 
*AND SALMAS.SIZE=.T.
@ 4,63 get m.size size 1,6 valid !empty(m.size) erro 'Enter Size....' when salmas.type='M'    PICT "@!KZ" FONT 'CONSOLAS',17 STYLE "B"
@ 4,71 get m.qty size 1,4,0  PICT "@!KZ" VALI CHKA() WHEN SALMAS.type#"S"   FONT 'CONSOLAS',17 STYLE "B"
*or SUPP=.F.
@ 4,78 get m.amount size 1,8,2  PICT "@!KZ" when .f. FONT 'CONSOLAS',17 STYLE "B"
@ 4,92 get m.salesman size 1,4 pict "@!KZ" vali chksal() when ldate.staff  FONT 'CONSOLAS',17 STYLE "B"
read
retu



	

proc chkr
IF LASTKEY()=-3
	IF !USED("SALMAS")
		SELECT 0
		USE SALMAS 
	ELSE 
		SELECT SALMAS 
	ENDIF 
ELSE
	SELECT TEMSAL 
ENDIF 

*IF CANCL=.T. 
*	M.RATE=ABS(M.RATE)*-1
*	SHOW GETS
*ENDI
if m.rate=0 AND M.CODE#'805'
	wait wind "Enter Rate..." nowa
	SELECT TEMSAL
	retu 0
endi
if M.TYPE="M" 
	*TRATE=M.RATE
	m.amount=val(m.size)*m.rate*m.qty
	show gets
endi

if m.type='S' and ldate.staff=.f.
	do chkunit
endi
DO METR
M.TAX=SALMAS.TAX
SELECT TEMSAL 
retu

PROC METR
if m.type#'S'
	@ 3,63 say padc("Size",6) colo w+
endi		
do case
	case m.code="806"
		@ 3,53 say padc("Metre",6) colo w+
		@ 4,53 get tsize size 1,6,2 VALI !EMPT(TSIZE) DEFA 1
		read
		*M.RATE=TRATE
		m.size=str(tsize,6,2)
		show gets
	case m.code="801" 
		@ 4,30 GET TDIS SIZE 1,5,2
		READ
		M.NAME="DISCOUNT @ "+STR(TDIS,5,2)+" %"
		m.rate=ROUND((TAMTS*(TDIS/100))*-1,0)
		
		M.AMOUNT=ROUND((TAMTS*(TDIS/100))*-1,0)
		SHOW GETS
	case  m.code="802"
		@ 4,22 GET TADD SIZE 1,6,2 
		READ
		M.RATE=TADD
		M.AMOUNT=M.RATE
		SHOW GETS 
	case  m.code="803" 
		@ 4,30 GET TLES SIZE 1,6,2 
		READ
		m.rate=TLES*-1
		m.amount=(m.rate)
		SHOW GETS
	case  m.code="804" AND 1=2 
		@ 4,22 GET  TCHA SIZE 1,8,2 
		READ
		m.rate=TCHA*-1
		m.amount=(m.rate)
		SHOW GETS
	case  m.code="805"
		@ 4,6 GET Tcanl SIZE 1,33
		keyb"{end}"
		READ
		m.name=tcanl
		CANCL=.T.
		show gets
*	case M.CODE='110'
*		M.SIZE='1.30'
*		show gets

ENDCASE
if m.type='S' and ldate.staff=.f. AND M.CODE#"804"
	do chkunit
	keyb "{END}"
	keyb "{Enter}"

ENDIF
IF EDT=.F. AND (RET=.F. OR EXC=.F.) AND LEN(ALLT(M.BARID))<=7 AND m.type#'S'
	KEYB "{ENTER}"
	IF CDAT='AKSN'
		KEYB "{ENTER}"
	ENDI
ENDIF

if ALLT(m.code)='0'
	SELECT TEMSAL 
	deac popu pur	
	rele wind purmain
	RELE wind bmain 

IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 
IF USED("PUR")
	SELECT PUR
	USE
ENDI 


IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF USED("SALMAS")
	SELECT SALMAS
	USE
ENDI 
IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 
IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 
endi	
SELECT TEMSAL 
RETU

proc chka
IF LAST()=19
	SELECT TEMSAL 
	RETU
ENDIF
IF EDT=.T. 
	IF (TSTKCHK=.T. AND TBAR=.T.) OR TBARQ=.T.
		IF M.QTY>TBAL1
			STKBAL=.T.
		ELSE
			STKBAL=.F.
		ENDIF 
		IF STKBAL=.T.
			*MESSAGEBOX("STOCK NOT AVAILABE",0,"STORE")
			WAIT WINDOW "STOCK NOT AVAILABE" NOWAIT 
			M.CODE=""
			M.QUALITY=""
			m.hsncode=""
			M.RATE=0
			M.QTY=0
			M.ACOMPANY=0
			TBAR=.F.
			TBARQ=.F.
			SHOW GETS 
			RETURN 0
		ENDIF 
	ENDIF 
ENDIF 
IF CANCL=.T. OR M.CODE="804" OR M.CODE="805"  OR M.CODE="806" OR RET=.T. OR EXC=.T.
	M.QTY=ABS(M.QTY)*-1
	SHOW GETS
ENDI
if empt(m.qty)
	wait wind "Enter Quantity..." nowa
	SELECT TEMSAL
	retu 0
endi
if m.type='M'
	m.amount=val(m.size)*m.qty*m.rate	
else
	m.amount=m.rate*m.qty
endi
if M.TYPE="M" 
	m.amount=val(m.size)*m.rate*m.qty
	show gets
endi
*IF M.CODE="110"
*	*M.SIZE=ALLT(STR(INT(VAL(M.SIZE))*M.QTY))
*	M.MTR=ALLT(STR(INT(VAL(M.SIZE))*M.QTY))
*	M.AMOUNT=M.RATE*VAL(M.MTR)
*ENDI
show gets
if ldate.staff=.f.
	do chkunit
	keyb "{END}"
	keyb "{Enter}"
ENDIF 
SELECT TEMSAL 
retu

proc chkentno
sele 15
use
sele SALE
temfile='TEMP\entno.dbf'
set safe off
IF XTTYPE="NEW"
	COPY STRU to (temfile) for DATE>=FINALDATE AND DATE<=FINALDATE1 AND invno=Tinvno and COMPANY=tCOMPANY with cdx
ELSE
	COPY to (temfile) for DATE>=FINALDATE AND DATE<=FINALDATE1 AND invno=Tinvno and COMPANY=tCOMPANY with cdx
ENDIF 
sele 15
use (temfile) alias temsal
IF ALLTRIM(XTTYPE)="CAN"
	REPLACE ALL QTY WITH QTY*-1,AMOUNT WITH AMOUNT*-1
ENDIF 
XXX=RECN()
tot=0
go top
scan
	tot=tot+amount
	IF TINCTAX=.F.
		TOT=TOT+(AMOUNT*CTAX)+(AMOUNT*STAX)
	ENDIF 
	TQ=TQ+QTY
ends
if xxx>1
	go xxx
endi
do paise WITH TOT
do NUMBERN with gt
DO NUMQTYN WITH TQ
sele temsal
appe blank
repl name with "NEW"
retu




proc chkcode
IF EMPT(M.CODE)
	SELECT TEMSAL
	RETU -1
ENDIF
*IF M.CODE="801" or M.CODE='803' 
*SELE TAX FROM TEMSAL GROUP BY TAX WHER !EMPTY(NAME) AND UPPER(ALLT(NAME))#'NEW' INTO CURS RE
*SELE RE
*COUN TO X
*IF X>1
	*DO DISCMULT
*	SELE TEMSAL
	*retu 0
*ENDI 
*SELE TEMSAL
*ENDI

IF M.CODE="801" AND DISCFOUND=1 
*AND RECN()#LESSRECN
	DO DISCFOUND
	SELECT TEMSAL
	RETU 0
ENDI
IF DISCFOUND=1 AND M.CODE#"0" AND M.CODE#"."
	DO DISCFOUND
	SELECT TEMSAL
	RETU 0
ENDI
GCODE=ALLT(M.CODE)
IF GCODE="ABCD."
	M.CODE="."
ENDI
if allt(m.code)='0'
	BILLCONT=.F.
ENDI
IF ALLT(m.code)='0' OR ALLT(m.code)='00' OR ALLT(M.CODE)="."
	deac popu pur
	rele wind purmain
	RELE wind bmain 
	IF USED("PURCHASE")
		SELECT PURCHASE
		USE
	ENDI 
	IF USED("PUR")
		SELECT PUR
		USE
	ENDI 
 
	IF USED("PARTY")
		SELECT PARTY
		USE
	ENDI 
	IF USED("SALMAS")
		SELECT SALMAS
		USE
	ENDI 
	IF USED("MAINSALE")
		SELECT MAINSALE
		USE
	ENDI 
	IF USED("SALE")
		SELECT SALE
		USE
	ENDI 
	IF USED("PAYMENT")
		SELECT PAYMENT
		USE
	ENDI 
ENDIF 

sele salmas
set order to code
seek LEFT(ALLT(m.code),3)
if !found()
	set order to name
	defi popu prdd from 6,1 to 20,40  shad COLO W+/N+,W+/N+,W+/N+,W+/N+,W+/N+,N+/W+;
	title padc("Name",30)+" "+padl("Code",5) prompt field padr(ALLTRIM(name),30)+"|"+PADR(code,5)scroll margin FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1
	on sele popu prdd do selitem
*	acti popu prdd rest
if empty(m.NAME)
	sele temsal
	retu 0
endi	
else
	do selitem
endi
*TDIS=0
*TSIZE=0.00
TCHA=0.00
TADD=0.00
TLES=0.00
tmtr=0.00
tcanl="CANCEL BILL NO."
sele temsal
XXX=RECN()
SUM AMOUNT TO TAMTS for amount#0
GO XXX
****
IF VAL(M.CODE)=801 or VAL(M.CODE)=803
	DO METR
	*KEYB "{ENTER}"
ENDI
****
IF LDATE.AADI=.F.
*	KEYB "{ENTER}"
ENDI
SELECT TEMSAL 
retu

proc selitem
SELE SALMAS
m.code=salmas.code
m.hsncode=salmas.hsncode
IF 1=2
DO CASE
	CASE SALMAS.COMP='SKT' 
	*OR DISCCOMP=1
		M.COMPANY=1
		M.fcode=tcom
		M.INVNO=TINVNO
	CASE SALMAS.COMP='SCS' 
	*OR DISCCOMP=2
		M.COMPANY=2
		M.fcode=tcom1
		M.INVNO=TINVNO1
	CASE SALMAS.COMP='SKR'  
	*OR DISCCOMP=3
		M.COMPANY=3
		M.fcode=tcom2
		M.INVNO=TINVNO2
ENDC
ENDIF 
	M.COMPANY=TCOMPANY
	M.NAME=SALMAS.NAME
	M.TAX=SALMAS.TAX
SHOW GETS
IF LEN(ALLT(M.BARID))<10
	DEAC POPU PRDD
	SELECT TEMSAL 
	RETU
ENDI
M.TYPE=SALMAS.TYPE
sele temsal
show gets
deac popu prdd
retu


proc chkunit
SELECT TEMSAL 
if IIF(M.CODE#'805',empt(m.rate) or last()=15,.F.)
	SELECT TEMSAL
	retu -2
endi
sele temsal
if salmas.type#'S' AND SALMAS.TYPE#'M'
	m.amount=m.rate*m.qty
endi
if M.TYPE="M" 
	m.amount=val(m.size)*m.rate*m.qty
	show gets
endi

if m.type='M'
	m.discamt=(val(m.size)*m.qty*m.rate)-m.amount	
else
	m.discamt=(m.rate*m.qty)-m.amount
endi

*IF M.CODE="110"
*	M.AMOUNT=M.RATE*VAL(M.MTR)
*ENDI
IF M.QTY<0 
	DO CASE
		CASE EXC=.T.
			M.EXRET=1
		CASE RET=.T.
			M.EXRET=2
	ENDC
ENDI
show gets

***********[FOR DISCOUNT TAX CALC]
IF M.CODE="801" OR M.CODE="803"
	SELECT TAX FROM TEMSAL GROUP BY TAX WHERE !EMPT(AMOUNT) INTO TABLE VGG
	M.TAX=VGG.TAX
	SELE VGG
	USE
ENDI
***********
SELE TEMSAL
Gath Memv
XXX=RECN()
count for name="NEW" to kk
TSALESMAN=M.SALESMAN
tot=0
tq=0
TMET=0
go top
lessfound=.f.
scan
	IF CODE#"804"
*		tq=tq+qty
		IF TYPE="M"
			TMET=TMET+(VAL(SIZE)*QTY)
		ENDI
	ENDI
	if CODE="801"
		LESSRECN=RECN()
		lessfound=.t.
	endi	
	tot=tot+amount
	IF TINCTAX=.F.
		TOT=TOT+(AMOUNT*CTAX)+(AMOUNT*STAX)
	ENDIF 
	
ends
**********
SELECT TEMSAL 
SUM QTY FOR QTY>0 TO XQTY
SUM QTY FOR QTY<0 TO YQTY
IF (XQTY#0 AND YQTY#0) OR (XQTY#0 AND YQTY=0)
	TQ=XQTY
ELSE
	TQ=YQTY
ENDI
**********
DISCFOUND=0
SCAN FOR CODE="801" 
	DISCFOUND=1
ENDS
if xxx>1
	go xxx
endi
if kk=0
	appe blank
	repl name with "NEW"
endi
IF EDT=.F. 

ELSE
	SELECT TEMSAL
	SCAT MEMV BLANK
	SHOW GETS
ENDIF
M.BARID=""
do paise WITH tot
@23,47 say STR(TMET,6,2)+"     "+str(tq,4)+" "+str(gt,10,2) colo W+/N+
DO NUMBERN WITH GT
DO NUMQTYN WITH TQ
retu





proc chksal

IF LEN(ALLT(STR(M.SALESMAN)))>=6
	WAIT WIND "CODE NOT FOUND.." NOWA
	M.SALESMAN=0
	SHOW GETS
	sele temsal
	retu 0
ENDI 
sele staff
set order to code
seek m.salesman
if !found()
	*	defi popu stff from 6,40 to 20,78 shad COLO W+/N+,W+/N+,W+/N+,W+/N+,W+/N+,N+/W+;
	*	title padc("Name",25)+"   "+padl("Code",5) prompt field padr(sname,30)+"º"+STR(code,5) scroll margin
	*	on sele popu stff do selsal
	*	acti popu stff rest
	WAIT WIND "CODE NOT FOUND.." NOWA
	M.SALESMAN=0
	SHOW GETS
	sele temsal
	retu 0

	if empty(m.salesman)
		M.SALESMAN=0
		SHOW GETS
		sele temsal
		retu 0
	endi	
else
	do selsal
endi
sele temsal
do chkunit
retu

proc selsal
m.salesman=staff.code
show gets
deac popu stff
retu


proc deli
@ 1,76 say "                    " COLO N+/N+
IF ALIAS()="TEMSAL"
sele temsal
IF CODE="805"
	CANCL=.F.
ENDI
IF LESSFOUND=.T. AND AMOUNT>0 
*AND RECN()<LESSRECN
	DO LESSFOUND
	SELECT TEMSAL 
	RETU
ENDI
IF CODE="801"
	DISCCOMP=0
ENDI
if UPPER(ALLT(name))#"NEW"
	dele
	rein
	pack
ENDI
tot=0
TQ=0
TMET=0
go top
lessfound=.f.
LESSRECN=0
scan
	IF CODE#"804"
		TQ=TQ+QTY
		IF TYPE="M"
			TMET=TMET+(VAL(SIZE)*QTY)
		ENDI
	ENDI
	if CODE="801"
		lessfound=.t.
		LESSRECN=RECN()
	endi	
	tot=tot+amount
	IF TINCTAX=.F.
		TOT=TOT+(AMOUNT*CTAX)+(AMOUNT*STAX)
	ENDIF 

ends

**********
SUM QTY FOR QTY>0 TO XQTY
SUM QTY FOR QTY<0 TO YQTY
IF (XQTY#0 AND YQTY#0) OR (XQTY#0 AND YQTY=0)
	TQ=XQTY
ELSE
	TQ=YQTY
ENDI
**********
DISCFOUND=0
SCAN FOR CODE="801" 
*OR CODE="802" OR CODE="803" OR CODE="804" OR CODE="806" 
	DISCFOUND=1
ENDS
do paise with tot

*@22,50 say padl("Total:"+str(tq,4)+" "+str(gt,10,2),27) colo gr+/gb+

@23,47 say STR(TMET,6,2)+"     "+str(tq,4)+" "+str(gt,10,2) colo W+/N+

keyb "{end}"
do NUMBERN with gt
DO NUMQTYN WITH TQ
ENDI
retu



proc chkcust
sele PARTY
set order to Pcode
seek tcustcode
if found()
	do selcust
else
	defi popu cust from 2,10 to 15,75  shad colo g+/n+,g+/n+,g+/n+;
	title "Customer Master" footer "=> to  Select" prompt field  ;
	padl(Pname,30) +"|"+padl(city,25)+"|"+str(Pcode,5)  scroll margin FONT 'CONSOLAS',14 STYLE "B"  IN WINDOW Form1
	on sele popu cust do selcust
	acti popu cust
endi
sele temsal
retu

proc selcust
	tcustcode=cust.Pcode
	tcustname=cust.Pname
	tcustadd1=cust.add1
	tcustadd2=cust.add2
	tcustadd3=cust.add3
	tcustcity=cust.city
	show gets
	deac popu cust
retu	



proc chkdisc
sele temsal
sum amount for disc="û" to sss
tdiscamt=round(sss*(tdiscper/100),0)
show gets
retu

proc paise
PARA XYZ
gtt=0.00
IF XYZ<=0.00
	NEG=.T.
ELSE
	NEG=.F.
ENDI
gtt=ABS(XYZ)-int(ABS(XYZ))
*do case
*	case gtt<=.30
*		gt=int(XYZ)
*	case gtt>=.31 and gtt<=.79
*		gt=int(XYZ)+IIF(NEG,-.50,.50)
*	case gtt>=.80
*		gt=round(XYZ,0)
*endc
GT=round(XYZ,0)
*GT=int(XYZ)
retu GT


proc metre
if m.rate=0
	wait wind 'Enter rate....'  nowa
	SELECT TEMSAL
	retu 0
endi
trate=m.rate
tsqty=m.qty
defi wind aa from 8,62 to 22,79 none colo sche 10 FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1
acti wind aa
set safe off
sele 17
use
sele salespc
tfile='temp\'+sys(3)+'.dbf'
COPY stru to (tfile) with cdx for invno=tinvno and date=tdate
sele 17
use (tfile) alias pieces
sele pieces
appe blank
brow fiel mts :8 ,pcs :5 :V=chkpc() :F
rele wind aa
retu

proc cust
WAIT WINDOW "CUSTOMER NAME ENTRY" NOWAIT 
defi wind ct from 20,15 to 25,60 titl "Customer Detail" noshad FONT 'CONSOLAS',13 STYLE "B" COLO w+/R+,W+/R+,w+/w+,w+/w+
ACTIVATE WINDOW CT IN WINDOW PURMAIN TOP  
@ 0,1 say  "Mobile  : " get tmob size 1,10 COLO ,W+/B+ VALI CHKMOB() PICT "@K"
@ 1,1 say  "Name    : " get tcustname size 1,30 COLO ,W+/B+ PICT "@K"
@ 2,1 say  "City    : " get tcustcity size 1,30 COLO ,W+/B+ PICT "@K"
@ 3,1 say  "Gst     : " get ttinno size 1,15 COLO ,W+/B+ PICT "@K"
READ
if !empt(tcustname)
	IF USED("CUST")
		SELECT CUST
		USE
	ENDIF 
	IF !USED("CUST")	
		sele 0
		use cust
	ENDIF
	SELECT CUST 
	SET ORDER TO MOBILE
	SEEK TMOB
	IF !FOUND() 
		appe blank
		repl name with tcustname,gst with TTINNO,city with tcustcity,date with td,MOBILE WITH TMOB
	ENDIF 
	IF USED("CUST")
		SELECT CUST
		USE
	ENDIF 
endi
SELECT TEMSAL 
rele wind
RETURN 


proc chkpc
if mts=0
	sele pieces
	go top
	sum trate*mts*pcs,pcs to rates,tpcs for mts#0
	sele temsal
	m.qty=tpcs
	m.rate=rates
	m.amount=rates
	show gets
	keyb "{ctrl+w}"
	sele temsal
	retu
endif
go bott 
if !empt(mts) and !empt(pcs)
	sele pieces
	keyb "{ctrl+n}"
endi
keyb "{pgdn}"
retu


PROC RW
IF RW="1"
	RW="2"
	tcustcode=990000
	@ 1,76 SAY "W"
ELSE
	RW="1"
	tcustcode=180000
	@ 1,76 SAY "R"
ENDI
SHOW GETS
RETU


proc lessfound
SET CURS OFF
defi wind hh from 6,20 to 16,60 colo sche 7 shad FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1
acti wind hh
@ 1,1 say padc("W A R N I N G",39) COLO W*+/R+
@ 3,1 SAY padc("Discount Amount Found",39)
@ 5,1 say padc("Remove Discount Amount First",39)
@ 7,1 SAY PADC("Press Enter to Continue...!",39) 
read
SET CURS ON
rele wind hh
retu



proc DISCfound
SET CURS OFF
defi wind hh from 6,20 to 16,60 colo sche 7 shad FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1
acti wind hh
@ 1,1 say padc("W A R N I N G",39) COLO W*+/R+
@ 3,1 SAY padc("Discount Amount Already Found",39)
@ 5,1 say padc("Two Discounts Not Allowed",39)
@ 7,1 SAY PADC("Press Enter to Continue...!",39)
read
SET CURS ON
rele wind hh
retu -1


proc DISCmult
RETU
SET CURS OFF
defi wind hh from 6,20 to 16,60 colo sche 7 shad FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1
acti wind hh
@ 1,1 say padc("W A R N I N G",39) COLO W*+/R+
@ 3,1 SAY padc("Multiple Tax Found",39)
@ 5,1 say padc("Discounts Not Allowed",39)
@ 7,1 SAY PADC("Press Enter to Continue...!",39)
*read
SET CURS ON
rele wind hh
*retu -1




PROC CHKBAR
IF LASTKEY()=13 AND EMPTY(M.BARID) AND EDT=.F. 
	DO ITEMLIST
ENDIF 
IF _CUROBJ=1 AND LAST()=5
	KEYB "{ESC}"
	KEYB "{UPARROW}"
ENDI

IF EMPTY(M.BARID) 
	RETURN 0
ENDIF 
M.BARID=ALLT(M.BARID)
if m.barid="*"
	M.BARID="."
	NOPRINT=.T.
	*retu 
ENDIF 
TBAR=.F.
TBARQ=.F.
IF !USED("PUR")
	SELECT 0
	USE PUR
ENDI 
SELECT PUR
SET ORDER TO BARCODE
SEEK ALLTRIM(M.BARID)
IF FOUND() AND !EMPTY(M.BARID)
	SELECT * FROM PUR WHERE !EMPTY(BARCODE) AND ALLTRIM(BARCODE)=ALLTRIM(M.BARID) INTO CURS BCC ORDER BY STOCKQTY DESC
	SELECT BCC
	COUNT TO X
	IF X>1
		TITSEL=.F.
		WAIT WINDOW "MULTIPLE PRODUCT FOUND.... PLEASE SELECT THE PRODUCT..." NOWAIT 
		IF _curobj#1
			SELECT TEMSAL
			RETU
		ENDIF
		SELECT bcc	
		GO TOP
		TDET='padr(name,45)+"    "+STR(RRATE,7,2)+"   "+ALLTRIM(STR(SERIAL,7,2))+"   "+DTOC(EXPDATE)+"    "+ALLTRIM(STR(STOCKQTY,7,2))'
		TDET1='padc("Brand Name",45)+"   "+PADC("RATE",9)+"   "+PADC("SERIAL",9)+"   "+PADC("EXP DATE",12)+"   "+PADC("STOCK ",9)'
		DO POPUN WITH TDET,TDET1,"MULTIPLE PRODUCT FOUND.... PLEASE SELECT THE PRODUCT",1,1,20,95,"PURMAIN"
		IF TITSEL=.T.
			TITSEL=.F.
		ENDIF 

		*defi popu xbcc from 3,1 TO 15,110 shad COLO G+/N+,GR+/N+,G+/N+,G+/N+,G+/N+,N+/W+;
		title padc("Brand Name",45)+" "+PADC("RATE",7)+" "+PADC("SERIAL",7)+" "+PADC("EXP DATE",7)+" "+PADC("STOCK ",7) prompt field padr(name,40)+" "+STR(RRATE,7,2)+" "+ALLTRIM(STR(SERIAL,7,2))+" "+DTOC(EXPDATE)+" "+ALLTRIM(STR(STOCKQTY,7,2)) scroll margin FONT 'CONSOLAS',16 STYLE "B"  
		*on sele popu xbcc do sellist3
		*acti popu xbcc rest
		if last()=27
			M.BARID=""
			SELECT TEMSAL
			RETURN 
		ENDIF 
		SELECT PUR
		SET ORDER TO SERIAL
		SEEK BCC.SERIAL 
	ENDIF 
	M.BARID=ALLTRIM(STR(PUR.SERIAL))
	M.CODE=PUR.CODE
	M.QUALITY=ALLTRIM(PUR.BRANDNAME)+" "+ALLTRIM(PUR.NAME) 
	m.hsncode=PUR.hsncode
	IF EDT=.F.
		M.RATE=PUR.RRATE
		M.QTY=1
	ELSE
		M.RATE=TEMSAL.RATE
		M.QTY=TEMSAL.QTY
	ENDIF 
	M.ACOMPANY=PUR.COMPANY 
	TBAR=.T.
	IF PUR.PURNO#-1
		TBARQ=.T.
	ENDIF 
ENDIF 
SELECT TEMSAL
TBAR=.F.
SELECT PUR
SET ORDER TO SERIAL 
SEEK ALLTRIM(M.BARID)
IF FOUND() AND !EMPTY(M.BARID)
	M.CODE=PUR.CODE
	M.QUALITY=ALLTRIM(PUR.NAME) 
	m.hsncode=PUR.hsncode
	IF EDT=.F.
		M.RATE=PUR.RRATE
		M.QTY=1
	ELSE
		M.RATE=TEMSAL.RATE
		M.QTY=TEMSAL.QTY
	ENDIF 
	M.ACOMPANY=PUR.COMPANY 
	TBAR=.T.
*	IF PUR.PURNO#-1
*		TBARQ=.T.
*	ENDIF 
ENDIF 

IF EDT=.F.
	IF (TSTKCHK=.T. AND TBAR=.T.) OR TBARQ=.T.
		DO STKCHK
		IF STKBAL=.T.
			*MESSAGEBOX("STOCK NOT AVAILABE",0,"STORE")
			WAIT WINDOW "STOCK NOT AVAILABE" NOWAIT 
			M.CODE=""
			M.QUALITY=""
			m.hsncode=""
			M.RATE=0
			M.QTY=0
			M.ACOMPANY=0
			TBAR=.F.
			TBARQ=.F.
			SHOW GETS 
			RETURN 0
		ENDIF 
	ENDIF 
ENDIF 


SELECT TEMSAL
IF TBAR=.F.
	IF LEN(ALLT(M.BARID))#18 and LEN(ALLT(M.BARID))#22 AND M.BARID#"." AND M.BARID#"0" AND M.BARID#"ABCD."  AND LEN(ALLT(M.BARID))#1 AND LEN(ALLT(M.BARID))#2 AND LEN(ALLT(M.BARID))#3 AND LEN(ALLT(M.BARID))#8 
		SELECT TEMSAL
		RETU 0
	ENDI
ENDIF 
SELECT TEMSAL 
DO CASE 
	CASE TBAR=.T.
		sele salmas
		set order to code
		seek ALLT(m.code)
		IF FOUND()
			M.CODE=SALMAS.CODE
			M.NAME=M.QUALITY
			M.TYPE=SALMAS.TYPE
			M.TAX=SALMAS.TAX
			M.CTAX=SALMAS.CTAX
			M.STAX=SALMAS.STAX
			SHOW GETS  
			SELE TEMSAL
			IF !EMPTY(M.RATE) AND EDT=.F.
				KEYB "{ENTER}"
			ENDIF 
			IF !EMPTY(M.QTY) AND EDT=.F.
				KEYB "{ENTER}"
			ENDIF 
		ELSE
			SELE TEMSAL
			RETU 0
		ENDI
		show gets	
	CASE ALLT(M.BARID)="ABCD." 
		M.CODE="."
		KEYB "{ENTER}"
	CASE M.BARID="." 
		M.CODE="."
		KEYB "{ENTER}"
	CASE M.BARID="0" 
		M.CODE="0"
		KEYB "{ENTER}"
	CASE LEN(ALLT(M.BARID))=18 AND 1=2
		M.CODE=ALLT(STR(VAL(substr(ALLT(M.BARID),1,4))))
		IF RATECOL=.F.
			M.RATE=VAL(ALLT(substr(ALLT(M.BARID),14,5)))
		ENDIF
		sele salmas
		set order to code
		seek LEFT(ALLT(m.code),3)
		IF SALMAS.COMP='SKR'
			M.SIZE=ALLT(substr(ALLT(M.BARID),12,2))
		ENDI
		IF (RET=.F. OR EXC=.F.) AND LEN(ALLT(M.BARID))=18
			M.QTY=1
		ELSE
			M.QTY=0
		ENDI
		IF ALLT(COUNTER)="RETURN"
			M.QTY=-1
		ENDI
		SELE TEMSAL

		SHOW GETS
		DO CHANSIZE
		KEYB "{ENTER}"
		if edt=.f.
			KEYB "{ENTER}"
		endi

	CASE LEN(ALLT(M.BARID))=8 AND 1=2
		M.CODE=ALLT(STR(VAL(substr(ALLT(M.BARID),1,3))))
		IF RATECOL=.F.
			M.RATE=VAL(ALLT(substr(ALLT(M.BARID),4,5)))
		ENDIF
		sele salmas
		set order to code
		seek LEFT(ALLT(m.code),3)
			M.NAME=SALMAS.NAME
			M.TYPE=SALMAS.TYPE
			M.QTY=1
	
		IF M.RATE>SALMAS.BARATE
			M.TAX=SALMAS.TAX1
		ELSE
			M.TAX=SALMAS.TAX
		ENDI


		SELE TEMSAL
		SHOW GETS
		*DO CHANSIZE
		KEYB "{ENTER}"
			KEYB "{ENTER}"
		IF EDT=.F.
			KEYB "{ENTER}"
		ENDI
	CASE LEN(ALLT(M.BARID))=7 AND 1=2
		SELE PUR
		SET ORDE TO SERIAL
		SEEK M.BARID
		IF FOUND()
		M.CODE=PUR.CODE
		M.RATE=PUR.RRATE
		sele salmas
		set order to code
		seek LEFT(ALLT(m.code),3)
			M.NAME=SALMAS.NAME
			M.TYPE=SALMAS.TYPE
		IF (RET=.F. OR EXC=.F.) AND LEN(ALLT(M.BARID))=18
			M.QTY=1
		ELSE
			M.QTY=0
		ENDI
		IF ALLT(COUNTER)="RETURN"
			M.QTY=-1
		ENDI
			SELE TEMSAL

		SHOW GETS
		DO CHANSIZE
		KEYB "{ENTER}"
		if edt=.f.
			KEYB "{ENTER}"
		endi
		ELSE
			SELECT TEMSAL
			RETU 0
		ENDI
		
	CASE LEN(ALLT(M.BARID))=22 AND 1=2
		M.CODE=ALLT(STR(VAL(substr(ALLT(M.BARID),1,4))))
	IF RATECOL=.F.
		M.RATE=VAL(ALLT(substr(ALLT(M.BARID),14,5)))
	ENDI
		M.DISC=VAL(ALLT(substr(ALLT(M.BARID),21,2)))
		sele salmas
		set order to code
		seek LEFT(ALLT(m.code),3)
		IF SALMAS.COMP='SKR'
			M.SIZE=ALLT(substr(ALLT(M.BARID),12,2))
		ENDI
		IF (RET=.F. OR EXC=.F.) AND LEN(ALLT(M.BARID))=22
			M.QTY=1
		ELSE
			M.QTY=0
		ENDI
		SHOW GETS
		DO CHANSIZE
		KEYB "{ENTER}"
		if edt=.f.
			KEYB "{ENTER}"
		endi
	if m.disc#0
		KEYB "{ENTER}"
	endi

	CASE LEN(ALLT(M.BARID))<=3 
		M.CODE=ALLT(M.BARID)
		sele salmas
		set order to code
		seek ALLT(m.code)
		IF FOUND() 
			M.NAME=SALMAS.NAME
			M.TYPE=SALMAS.TYPE
			M.TAX=SALMAS.TAX
			M.CTAX=SALMAS.CTAX
			M.STAX=SALMAS.STAX
			
			IF SALMAS.TYPE#'S' OR EMPTY(SALMAS.TYPE)
				IF EDT=.F.
					M.RATE=SALMAS.COST
					M.QTY=1
				ELSE
					M.RATE=TEMSAL.RATE
					M.QTY=TEMSAL.QTY
				ENDIF 
				SELE TEMSAL
				IF !EMPTY(M.RATE) AND EDT=.F.
					KEYB "{ENTER}"
				ENDIF 
				IF !EMPTY(M.QTY) AND EDT=.F.
					KEYB "{ENTER}"
				ENDIF 
				KEYB "{ENTER}"
			ENDIF 
			SHOW GETS  
		ELSE
			SELE TEMSAL
			RETU 0
		ENDI
	show gets	
ENDC
SELECT TEMSAL 
RETU



PROC EXC
IF EXC=.F.
	EXC=.T.
	RET=.F.
	@ 22,29 SAY "Ret" COLO GR+/N+
	@ 22,21 SAY "Exc" COLO W*+/N+
ELSE
	EXC=.F.
	@ 22,21 SAY "Exc" COLO GR+/N+
ENDI
SHOW GETS
RETU


PROC RET
IF RET=.F.
	RET=.T.
	EXC=.F.	
	@ 22,29 SAY "Ret" COLO W*+/N+
	@ 22,21 SAY "Exc" COLO GR+/N+
ELSE
	RET=.F.
	@ 22,21 SAY "Ret" COLO GR+/N+
ENDI
SHOW GETS
RETU


PROC CHANSIZE
DO CASE
	CASE ALLT(M.SIZE)='45'
		M.SIZE='F'
	CASE ALLT(M.SIZE)='47'
		M.SIZE='S'
	CASE ALLT(M.SIZE)='49'
		M.SIZE='M'
	CASE ALLT(M.SIZE)='51'
		M.SIZE='L'
	CASE ALLT(M.SIZE)='53'
		M.SIZE='XL'
	CASE ALLT(M.SIZE)='55'
		M.SIZE='XXL'
	CASE ALLT(M.SIZE)='57'
		M.SIZE='XXXL'
	CASE ALLT(M.SIZE)='58'
		M.SIZE='100'
	CASE ALLT(M.SIZE)='59'
		M.SIZE='105'
	CASE ALLT(M.SIZE)='61'
		M.SIZE='110'
	CASE ALLT(M.SIZE)='62'
		M.SIZE='115'
	CASE ALLT(M.SIZE)='77'
		M.SIZE='120'
	CASE ALLT(M.SIZE)='63'
		M.SIZE='OS'
	CASE ALLT(M.SIZE)='64'
		M.SIZE='55'

	CASE ALLT(M.SIZE)='66'
		M.SIZE='45'

	CASE ALLT(M.SIZE)='67'
		M.SIZE='4XL'

	CASE ALLT(M.SIZE)='69'
		M.SIZE='5XL'

	CASE ALLT(M.SIZE)='71'
		M.SIZE='00'
ENDC
SHOW GETS
RETU


PROC CHKGIVEN
IF TGIVEN<0 OR TGIVEN>99999
	TGIVEN=0
	SELECT TEMSAL
	RETU 0
ENDI	
TRETURN=TGIVEN-GT
IF ALLT(XTBILL)#"GST"
	TBYCARD=0
	TBYCASH=GT
ENDIF 
SHOW GETS
RETU


PROC CHKBYCARD
IF TBYCARD<0 OR TBYCARD>99999
	TBYCARD=0
	SELECT TEMSAL
	RETU 0
ENDI	
TBYCASH=GT-TBYCARD
SHOW GETS
RETU


proc park
sele temsal
XXXX=RECN()
COUNT TO XX
IF XX=1
	GO XXXX
	RETU
ENDI
PARK=.T.
PARKAMT=GT
set safe off
copy to TEMP\scr1
sele temsal
PARKINVNO=TINVNO
PARKTDIS=TDIS
m.barid='0'
keyb '{enter}'
retu


PROC PCHKUNIT
sele temsal
XXX=RECN()
count for name="NEW" to kk
tot=0
tq=0
TMET=0
go top
lessfound=.f.
scan
	IF CODE#"804"
*		tq=tq+qty
		IF TYPE="M"
			TMET=TMET+(VAL(SIZE)*QTY)
		ENDI
	ENDI
	if CODE="801"
		LESSRECN=RECN()
		lessfound=.t.
	endi	
	tot=tot+amount
	IF TINCTAX=.F.
		TOT=TOT+(AMOUNT*CTAX)+(AMOUNT*STAX)
	ENDIF 
ends
**********
SUM QTY FOR QTY>0 TO XQTY
SUM QTY FOR QTY<0 TO YQTY
IF (XQTY#0 AND YQTY#0) OR (XQTY#0 AND YQTY=0)
	TQ=XQTY
ELSE
	TQ=YQTY
ENDI
**********
DISCFOUND=0
SCAN FOR CODE="801" 
*OR CODE="802" OR CODE="803" OR CODE="804" OR CODE="806" 
	DISCFOUND=1
ENDS
if xxx>1
	go xxx
endi
if kk=0
	appe blank
	repl name with "NEW"
endi
keyb "{END}"
keyb "{Enter}"
do paise WITH TOT
@23,47 say STR(TMET,6,2)+"     "+str(tq,4)+" "+str(gt,10,2) colo W+/N+
DO NUMBERN WITH GT
DO NUMQTYN WITH TQ
RETU




proc parkr
IF RECC()#1 OR PARK=.F. OR _CUROBJ#0
	SELECT TEMSAL
	RETU 
ENDIF
@ 5,15 SAY PADC("",49) COLO N+/N+ 
sele temsal
DELE FOR EMPT(RATE)
PACK
appe from TEMP\scr1
sele temsal
repl all invno with parkinvno,date with parkdate FOR COMPANY=TCOMPANY
*repl all invno with parkinv1,date with parkdate FOR COMPANY=2
*repl all invno with parkinv2,date with parkdate FOR COMPANY=3
****FOR DISCOUNT % RECALL
TDIS=PARKTDIS
****
GO BOTT
DO PCHKUNIT
KEYB '{END}'
*KEYB '{ENTER}'
PARK=.F.
@ 5,15 SAY PADC('',49) COLO W+*/N+
retu


proc chktsize
if tsize=0
	SELECT TEMSAL
	retu 0
endi
retu


PROC AMTRET
@23,0 SAY PADC(' ',80) COLO N+
@ 23,1 SAY 'L.BILL AMT:'+STR(XAMT,8,2) COLO W+/N+
@ 23,28 SAY 'RECEIVED:'+STR(XGIVEN,8,2) COLO W+/N+
@ 23,56 SAY 'RETURN  :'+STR(XRETURN,8,2) COLO W+/N+
RETU


PROC DAYTOT
T=CODECONV(INT(DSALE/1000))
@1,74 SAY T
RETU


PROC CODECONV
PARA XXX
TCOSTX=SPAC(5)
tc=allt(str(XXX,5))
for ix=1 to len(tc)
	tcostx=ALLT(tcostx)+finds(subs(tc,ix,1))
endf
RETU TCOSTX



FUNC FINDS
PARA XX
DO CASE
	CASE XX="1"
		YY="J"
	CASE XX="2"
		YY="A"
	CASE XX="3"
		YY="M"
	CASE XX="4"
		YY="E"
	CASE XX="5"
		YY="S"
	CASE XX="6"
		YY="B"
	CASE XX="7"
		YY="O"
	CASE XX="8"
		YY="N"
	CASE XX="9"
		YY="D"
	CASE XX="0"
		YY="X"
	CASE XX="."
		YY="."
ENDC
RETU YY




proc selcount
tccno=crcount.cno
TNAME1=crcount.NAME1

selcnt=.t.
deac popu crcount


PROC WBILL
IF WBILL=.F.
	WBILL=.T.
	@ 1,44 SAY "W"
ELSE
	WBILL=.F.
	@ 1,44 SAY "O"
ENDI
RETU


PROC DISENT
IF _CUROBJ=1
	M.BARID="801"
	KEYB "{ENTER}"
ENDI
RETU


PROC ITEMLIST
LKEY=.T.
TITSEL=.F.
IF _curobj#1
	SELECT temsal
	RETU
ENDI
SELE SALMAS
set order to name
GO TOP 
TDET='padr(ALLTRIM(name),45)+" "+PADR(CODE,7)'
TDET1='padC("ITEM NAME",45)+" "+PADC("CODE",7)'
DO POPUN WITH TDET,TDET1,"ITEM MASTER",1,1,20,70,"PURMAIN"
SELECT SALMAS
IF TITSEL=.T.
	DO selits
	TITSEL=.F.
ENDIF 
SELECT TEMSAL 
RETURN 


proc selits
M.BARID=SALMAS.CODE
m.code=salmas.code
m.name=salmas.name
m.type=salmas.type

	IF M.RATE>SALMAS.BARATE
		M.TAX=SALMAS.TAX1
	ELSE
		M.TAX=SALMAS.TAX
	ENDI
	IF LKEY=.F.
		KEYB '{ENTER}'
	ENDIF 
SHOW GETS 
deac popu prdd
retu

PROC ITEMLISTXX
IF _curobj#1
	SELECT TEMSAL
	RETU
ENDIF
	SELE SALMAS
	set order to name
	defi popu prdd from 6,1 to 20,80  shad COLO G+/N+,G+/N+,G+/N+,G+/N+,G+/N+,N+/W+;
	title padc("Name",35)+" "+padl("TAX",8)+" "+padl("Code",5) prompt field padr(name,35)+"|"+STR(TAX,5,2)+"|"+PADR(code,5) scroll margin FONT 'CONSOLAS',16 STYLE "B"  
	on sele popu prdd do selitsXX
	acti popu prdd rest
	SELE TEMSAL
	KEYB '{ENTER}'
RETU


proc selitsXX
M.BARID=SALMAS.CODE
m.code=salmas.code
m.name=salmas.name
m.type=salmas.type
*IF M.RATE>SALMAS.BARATE
*	M.TAX=SALMAS.TAX1
*ELSE
	M.TAX=SALMAS.TAX
*ENDI
deac popu prdd
retu


PROC ITEMPURX
IF _curobj#1
	SELECT TEMSAL 
	RETU
ENDIF
	LKEY=.T.
	SELE PUR 
	set order to name
	defi popu prdd1 from 6,1 TO 27,95  shad COLO G+/N+,G+/N+,G+/N+,G+/N+,G+/N+,N+/W+;
	title padc("Brand Name",45)+" "+"  TAX    RATE     SERIAL    EXPDATE" prompt field padr(name,45)+" "+STR(TAX,7,2)+" "+STR(RRATE,7,2)+" "+ALLTRIM(STR(SERIAL,7))+" "+DTOC(EXPDATE) scroll margin FONT 'CONSOLAS',15 STYLE "B"  
	on sele popu prdd1 do selits1
	acti popu prdd1 rest
	SELE TEMSAL
RETU


proc selits1
M.BARID=ALLTRIM(STR(PUR.SERIAL))
m.code=PUR.code
KEYB '{ENTER}'
deac popu prdd1
RETU 

PROC APPRTRANS
	TNO=0
	Tcomp="SKR"
	TSERIAL="  "	
	ADATE=LDATE.DATE
	DEFI WIND XX FROM 7,25 TO 14,50 NONE COLO SCHE 10 FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1
	ACTI WIND XX
	@ 0,0 SAY PADC("APPROVAL TRANSFER",26) COLO SCHE 7
	@ 2,1 SAY "DATE    :" GET ADATE 
	@ 4,1 SAY "NO.     :" GET TNO SIZE 1,10 VALI CHKNO()
	READ
	RELE WIND XX
	IF LAST()#27 AND TNO#0
		SELE TEMSAL
		DELE ALL
		PACK
		SELE APPSALES
		SCAN FOR REF=TNO AND DATE=ADATE
			SCAT MEMV
			SELE TEMSAL
			APPE BLANK
			GATH MEMV
		ENDS
		SELE TEMSAL
		REPL ALL DATE WITH LDATE.DATE
		APPE BLANK
		REPL NAME WITH "NEW"
		SELE APPMAIN
		SCAN FOR REF=TNO AND DATE=ADATE
			m.custname=tcustname
			m.custaddr=tcustaddr
			m.custcity=tcustcity
			IF XAPR=0
				XAPR=APPMAIN.REF
				XAPRDATE=APPMAIN.DATE
			ENDI
		ENDS	
		SELE TEMSAL
	ENDI
	KEYB "{ESC}"
	KEYB "{END}"
	KEYB "{ENTER}"
RETU


PROC CHKCOMP
do case
	 CASE TCOMP="SKT" 
		TSERIAL="A "
	 CASE TCOMP="SCS" 
		TSERIAL="B "
	 CASE TCOMP="SKR" 
		TSERIAL="C "
ENDC
RETU



proc chksr
do case
	 CASE TCOMP="SKT" AND (TSERIAL#'A' AND TSERIAL#'X')
		wait wind "[A/X]" NOWA
		RETU 0
	 CASE TCOMP="SCS" AND (TSERIAL#'B' AND TSERIAL#'X')
		wait wind "[B/X]" NOWA
		RETU 0
	 CASE TCOMP="SKR" AND (TSERIAL#'C' AND TSERIAL#'X')
		wait wind "[C/X]" NOWA
		RETU 0
ENDC
RETU



PROC CHKNO
SELE APPMAIN
GO TOP
LOCA FOR DATE=ADATE AND REF=TNO
IF !FOUND()
	WAIT WIND "Approval Not Found...!" nowa
	SELE TEMSAL
	Retu 0
ENDI
IF !EMPT(APPMAIN.BILLDATE)
	SET CURS OFF
	defi wind hh from 9,23 to 13,57 colo sche 7 shad FONT 'CONSOLAS',14 STYLE "B" IN WINDOW Form1
	acti wind hh
	@ 1,1 say "ALREADY BILLED ON :"+DTOC(APPMAIN.BILLDATE) 
	READ
	RELE WIND HH
	SELE TEMSAL
	RETU 0
ENDI
RETU

PROC CHKDISCR
IF M.DISC#0
	M.RATE=ROUN(M.RATE-(M.RATE*M.DISC/100),0)
ELSE
	M.RATE=M.RATE
ENDI

if m.type='M'
	m.discamt=(val(m.size)*m.qty*m.rate)-m.amount	
else
	m.discamt=(m.rate*m.qty)-m.amount
endi
*wait wind str(m.discamt)
*M.DISCAMT=M.DRATE-M.RATE
SHOW GETS
IF M.RATE#0 
	IF SUPP=.T.
		KEYB "{ENTER}"
	ENDI
ENDI
RETU


PROC CANCBILL
TBLNO=0
DEFI WIND XX FROM 16,25 TO 20,50  FONT 'CONSOLAS',14 STYLE "B" IN WINDOW FORM1
ACTI WIND XX 
@ 0,0 SAY PADC("BILL CANCEL",26) COLO SCHE 1
@ 2,6 SAY "BILL NO:" GET TBLNO  SIZE 1,5
READ
RELE WIND XX
IF LAST()#27
	SELE TEMSAL
	DELE
	SELE SALE
	SCAN FOR INVNO=TBLNO
		SCAT MEMV
		SELE TEMSAL
		APPE BLANK
		M.QTY=M.QTY*-1
		M.AMOUNT=M.AMOUNT*-1
		GATH MEMV
	ENDS
	SELE TEMSAL
	SUM QTY TO TQ
	SUM AMOUNT TO GT
	GT=INT(GT)
	do NUMBERN with gt
	DO NUMQTYN WITH TQ
	appe blank
	repl name with "NEW"
	KEYB "{ESC}"
	KEYB "{END}"
	KEYB "{ENTER}"
ENDI
SELE TEMSAL
RETU


PROC PENDING
IF PENDING=.F.
	PENDING=.T.
	@ 1,44 SAY "PENDING" COLO G*+
ELSE
	PENDING=.F.
	@ 1,44 SAY "       "
ENDI
RETU


PROC RETUGATH
TBLNO=0
DEFI WIND XX FROM 8,25 TO 12,50 NONE COLO SCHE 7 FONT 'CONSOLAS',14 STYLE "B" IN DESKTOP 
ACTI WIND XX
@ 0,0 SAY PADC("RETURN BILL",26) COLO SCHE 1
@ 2,6 SAY "BILL NO:" GET TBLNO  SIZE 1,5
READ
RELE WIND XX
IF LAST()=27
	RETU
ENDI
SELE MAINSALE
SET ORDER TO INVNO
SEEK TBLNO
IF FOUND() 
	IF MAINSALE.AMOUNT<0
		SELE TEMSAL
		REPL CODE WITH "803",BARID WITH "803",NAME WITH "RETURN :"+ALLT(STR(MAINSALE.INVNO)),AMOUNT WITH MAINSALE.AMOUNT,RATE WITH MAINSALE.AMOUNT,TYPE WITH "P",RATE WITH MAINSALE.AMOUNT
		SELE TEMSAL
		SUM QTY TO TQ
		SUM AMOUNT TO GT
		GT=INT(GT)
		do NUMBERN with gt
		DO NUMQTYN WITH TQ
		appe blank
		repl name with "NEW"
		KEYB "{ESC}"
		KEYB "{END}"
		KEYB "{ENTER}"
	ENDI
ENDI
SELE TEMSAL
RETU





proc conv3
para d
	do case
		case len(d)=1
			retu '0000'+d
		case len(d)=2	
			retu '000'+d
		case len(d)=3	
			retu '00'+d
		case len(d)=4	
			retu '0'+d
		case len(d)=5	
			retu d
	endc
retu	

proc conv
para d
	do case
		case len(d)=1
			retu '000'+d
		case len(d)=2	
			retu '00'+d
		case len(d)=3	
			retu '0'+d
		case len(d)=4	
			retu d
	endc
retu	


proc conv2
para d
	do case
		case len(d)=1	
			retu '0'+d
		case len(d)=2	
			retu d
	endc
retu	


PROC CHANS
PARA SZ
DO CASE
      CASE SZ='F' 
        	 TDSIZE = '45'
      CASE SZ='S' 
	         TDSIZE = '47'
      CASE SZ='M' 
	         TDSIZE = '49'
      CASE SZ='L' 
	         TDSIZE = '51'
      CASE SZ='XL'
	         TDSIZE = '53'
      CASE SZ='2L'
        	 TDSIZE = '55'
      CASE SZ='3L'
	         TDSIZE = '57'
      CASE SZ='A0' OR SZ='58'
	     	 TDSIZE = '58'
      CASE SZ='A5'
	    	 TDSIZE = '59'
      CASE SZ='B0'
	     	 TDSIZE = '61'
      CASE SZ='B5'
	     	 TDSIZE = '62'
      CASE SZ='OS'
	     	 TDSIZE = '63'
      CASE SZ='55'
	     	 TDSIZE = '64'
      CASE SZ='45'
	     	 TDSIZE = '66'
	  OTHER
	  	 TDSIZE=SZ	
ENDC
RETU TDSIZE



PROC RATECOL
IF RATECOL=.F.
	RATECOL=.T.
	WAIT WIND "RATE COLUMN ENABLED...!" NOWA
ELSE
	RATECOL=.F.
	WAIT WIND "RATE COLUMN DISABLED...!" NOWA
ENDI
RETU

proc dbfopen
for ix=1 to 20
	db(ix)=dbf(ix)
endf
retu

proc dbfclose
close data
for ix=1 to 20
	sele (ix)
	IF FILE(DB(IX))
		DO CASE
			CASE IX=2
				use &db(ix) ALIAS MAINSALE
			CASE IX=3
				use &db(ix) ALIAS SALE
			OTHER
				use &db(ix)
		ENDC
	ENDI
endf
retu


PROCEDURE CHKPARTY
SELE PARTY
SET ORDER TO PNAME
SET FILTER TO 
SET CONFIRM ON 
IF SUPP=.F.
	IF TAGE#"ALL"
		SET FILTER TO 
		TCUSTNAME=""
		SHOW GETS 
		SET FILT TO ALLT(AGENT)=ALLT(TAGENT)
	ENDIF 
ELSE
	SET FILT TO AGCODE=TAGCODE
ENDIF 
IF !EMPTY(TCUSTNAME)
	SELECT PARTY
	SET FILTER TO 
	SET FILTER TO ALLTRIM(PNAME)=ALLTRIM(TCUSTNAME)
ENDIF 
defi popu findx from 1,1 FONT 'Consolas',15 STYLE "B" colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Name",30) prom fiel padr(Pname,35)+"-"+padr(city,25)
on sele popu findx do selfindx
acti popu findx 
SELE PARTY
SET FILT TO
IF EMPT(TCUSTNAME)
	WAIT WIND "PLEASE SELECT PARTY NAME" NOWA
ENDI 
IF ALLTRIM(XTBILL)="GST" AND VAL(TSTCODE)=0
	MESSAGEBOX("PLEASE ENTER STATE IN PARTY TO CONTIUE",0,"ERROR")  
	RETURN 0
ENDIF 
sele SALE 
retu


proc selfindx
SET CONFIRM ON 
TSTATE=PARTY.STATE
TSTCODE=PARTY.STCODE
TCUSTNAME=party.pname
TCUSTCITY=ALLTRIM(ALLTRIM(party.CITY)+IIF(!EMPTY(PARTY.PHONE),"  PH:"+ALLTRIM(PARTY.PHONE),""))
TCUSTADDR=party.add1
TAGENT=PARTY.AGENT
TCUSTCODE=PARTY.PCODE
TTINNO=PARTY.TIN
*TOPEN=PARTY.OPENING
PCREDIT=PARTY.OPCREDIT
PDEBIT=PARTY.OPDEBIT
IF ALLTRIM(XTTYPE)="NEW"
	SELECT MAINSALE
	SUM GTOT TO PPUR FOR CUSTCODE=TCUSTCODE AND DATE<=TDATE

	SELECT PAYMENT
	SUM CREDIT TO PPAY FOR PCODE=TCUSTCODE AND DATE<=TDATE
	SUM DEBIT TO PPAY1 FOR PCODE=TCUSTCODE AND DATE<=TDATE
	
	SELECT PURCHASE
	SUM AMOUNT TO PPUR1 FOR PCODE=TCUSTCODE AND DATE<=TDATE
	
	SELECT PARTY
	TPBAL=(PPAY1+PDEBIT+PPUR)-(PCREDIT+PPAY+PPUR1)
	IF TPBAL<0
		TPDET="BALANCE CREDIT Rs. "+ALLTRIM(STR(ABS(tpbal),10,2))
	ELSE
		TPDET="BALANCE DEBIT Rs. "+ALLTRIM(STR(tpbal,10,2))
	ENDIF 
ENDIF 
show gets
deac popu findx
retu



PROCEDURE CHKAGENT
IF SUPP=.T.
	RETURN 
ENDIF 
SELECT PARTY 
SET FILTER TO 
sele agent from party into curs tag grou by ageNt
sele tag
IF !EMPTY(TAGENT)
	SELECT TAG
	SET FILTER TO 
	SET FILTER TO ALLTRIM(AGENT)=ALLTRIM(TAGENT)
ENDIF 
defi popu finda from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Agent",30) prom fiel padr(agent,35) FONT 'Consolas',15 STYLE "B" 
on sele popu finda do selag
acti popu finda REST 
sele SALE 
retu



proc selag
Tagent=tag.agent
show gets
deac popu finda
RETURN



PROC  CHKINV
IF XTINVNO=0  
	RETU 0
ENDI 
SELE MAINSALE
SET ORDE TO INVNO
GO TOP 
LOCAT FOR DATE>=FINALDATE AND DATE<=FINALDATE1 AND COMPANY=TCOMPANY AND INVNO=XTINVNO
IF !FOUND()
	WAIT WIND "BILL NOT FOUND...." NOWA
	RETU 0
ELSE
	TDATE=MAINSALE.DATE
	TPBAL=MAINSALE.PBAL
	IF TPBAL<0
		TPDET="BALANCE CREDIT Rs. "+ALLTRIM(STR(ABS(tpbal),10,2))
	ELSE
		TPDET="BALANCE DEBIT Rs. "+ALLTRIM(STR(tpbal,10,2))
	ENDIF 
	SELECT PARTY
	SET ORDER TO PCODE
	SEEK MAINSALE.CUSTCODE
	IF FOUND()
		TCUSTCODE=PARTY.PCODE 
		TCUSTNAME=party.pname
		TCUSTCITY=ALLTRIM(ALLTRIM(party.CITY)+IIF(!EMPTY(PARTY.PHONE),"  PH:"+ALLTRIM(PARTY.PHONE),""))
		TCUSTADDR=party.add1
		TAGENT=PARTY.AGENT
		TTINNO=PARTY.TIN
		TSTATE=PARTY.STATE
		TSTCODE=PARTY.STCODE
	ENDIF 
	SHOW GETS 
ENDIF
SELECT MAINSALE 
RETU


PROCEDURE CHKXB
DO CASE 
	CASE XTBILL="EST"
		TCOMPANY=3
	CASE XTBILL="GST"
		TCOMPANY=1
	CASE XTBILL="TAX"
		TCOMPANY=2
ENDC
RETURN 


PROCEDURE PAEDIT
IF PEDIT=.F.
	PEDIT=.T.
	WAIT WINDOW "PARTY EDIT MODE ACTIVATED....!" NOWAIT 
ELSE
	PEDIT=.F.
	WAIT WINDOW "PARTY EDIT MODE DE-ACTIVATED....!" NOWAIT 
ENDIF 
RETURN 


PROCEDURE CCR
IF TTYPE=1
	TTYPE=2
	MESSAGEBOX("CARD BILL OPTION ENABLED",0,"STORE")
	@ 23,1 SAY "CARD BILL" COLO GR+/N+
	XTBILL='GST'
ELSE
	TTYPE=1
	MESSAGEBOX("CASH BILL OPTION ENABLED",0,"STORE")
	@ 23,1 SAY "CASH BILL" COLO GR+/N+
	XTBILL='EST'
ENDIF 	
RETURN 

PROCEDURE STKCHK
SELECT TEMSAL
STKBAL=.F.
IF LEN(ALLTRIM(M.BARID))=7
	SELECT PUR
	SUM QTY FOR SERIAL=VAL(M.BARID) TO TPP
	SELECT SALE
	SUM QTY FOR ALLTRIM(BARID)=ALLTRIM(M.BARID) TO TSS
	SELECT TEMSAL
	SELECT SUM(QTY) AS QTY FROM TEMSAL WHERE ALLTRIM(BARID)=ALLTRIM(M.BARID) AND !EMPTY(QTY) INTO CURSOR TSSC GROUP BY BARID 
	SELECT TSSC
	TSS1=TSSC.QTY
	TBAL=TPP-(TSS+TSS1)
	TBAL1=TPP-TSS
	IF TBAL<=0
		STKBAL=.T.
	ELSE
		STKBAL=.F.
	ENDIF 
	@ 1,76 say "                    " COLO N+/N+
	@ 1,76 say "STOCK : "+ALLTRIM(STR(TBAL)) FONT 'Consolas',17 STYLE "B" COLO GR+/N+
ELSE
	@ 1,76 say "                    " COLO N+/N+
ENDIF 
SELECT TEMSAL 
RETURN 




PROC ITEMPUR
LKEY=.T.
TITSEL=.F.
IF _curobj#1
	SELECT TEMSAL
	RETU
ENDIF
SELECT PUR
SET ORDER TO NAME 
IF TSTKCHK=.T.
*	SET FILTER TO STOCKQTY#0
ENDIF 
GO TOP 
TDET='padr(ALLTRIM(name)+" "+ALLTRIM(BRANDNAME),45)+" "+STR(RRATE,7,2)+"    "+ALLTRIM(STR(SERIAL,7))+" "+DTOC(EXPDATE)+" "+STR(TAX,7,2)+" "+STR(STOCKQTY,7)'
TDET1='padC("BRAND/QUALITY NAME",45)+" "+PADC("RATE",9)+"  "+PADC("BARCODE",9)+" "+PADC("EXP.DATE",10)+" "+PADC("TAX",9)+" "+PADC("STOCK",8)'
DO POPUN WITH TDET,TDET1,"SUPPLIER MASTER",1,1,20,95,"PURMAIN"
IF TITSEL=.T.
	DO selits2
	TITSEL=.F.
ENDIF 
SELECT TEMSAL 
RETURN 


proc selits2
M.BARID=ALLTRIM(STR(PUR.SERIAL))
m.code=PUR.code
RETU 

proc sellist3
DEACTIVATE popu xbcc 
SELECT PUR 
RETU 


PROCEDURE CHKMOB
IF !EMPTY(TMOB) AND LEN(ALLTRIM(STR(TMOB)))#10
	WAIT WINDOW "ENTER MOBILE NUMBER PROPERLY" NOWA
	RETURN 0
ENDIF 
IF !EMPTY(TMOB)
	IF USED("CUST")
		SELECT CUST
		USE
	ENDIF 
	IF !USED("CUST")	
		sele 0
		use cust
	ENDIF
	SELECT CUST 
	SET ORDER TO MOBILE
	SEEK TMOB
	IF FOUND()
		tcustname=CUST.NAME
		tcustcity=CUST.CITY
		ttinno=CUST.GST
	ENDIF 
	IF USED("CUST")
		SELECT CUST
		USE
	ENDIF 
ENDIF 
RETURN 




proc custN
WAIT WINDOW "Enter Mobile Number" NOWAIT 
defi wind ct from 20,15 to 23,50 titl "Customer Mobile Number Entry" noshad FONT 'CONSOLAS',18 STYLE "B" COLO w+/R+,W+/R+,w+/w+,w+/w+
ACTIVATE WINDOW CT IN WINDOW PURMAIN TOP  
@ 0,1 say  "Mobile  : " get tmob size 1,10 COLO ,W+/B+ VALI CHKMOB() PICT "@K"
READ
if !empt(tcustname)
	IF USED("CUST")
		SELECT CUST
		USE
	ENDIF 
	IF !USED("CUST")	
		sele 0
		use cust
	ENDIF
	SELECT CUST 
	SET ORDER TO MOBILE
	SEEK TMOB
	IF !FOUND() 
		appe blank
		repl date with td,MOBILE WITH TMOB
	ENDIF 
	IF USED("CUST")
		SELECT CUST
		USE
	ENDIF 
endi
SELECT TEMSAL 
rele wind
RETURN 




PROCEDURE CHKTDT
IF TDATE>FINALDATE1 OR TDATE<FINALDATE
	WAIT WINDOW "INVALIED DATE KINDLY CHECK THE YEAR..." NOWA
	RETURN 0
ENDIF 
RETURN 
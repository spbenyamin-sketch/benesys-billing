IF USED("PARTY")
	SELECT PARTY
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

IF !USED("MAINSALE")
	SELECT 0
	USE DATA\MAINSALE 
ENDI 
IF !USED("SALE")
	SELECT 0
	USE DATA\SALE 
ENDI 
IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 

SET TALK OFF
TSALVAL=0
TSALTAX=0
TIGSTAMT=0
TCGSTAMT=0
TSGSTAMT=0
TTOTAMT=0
TJPCODE=0

SELECT COMP
SELECT * FROM COMP INTO CURSOR TJCOMP WHERE COMPNO=TXCOM

FIRST=.T.
SET CENT ON
SET DATE BRIT
SET ENGINEBEHAVIOR 70
sele *,00000000.00 AS SALVAL,00000000.00 AS IGSTAMT,00000000.00 AS CGSTAMT,00000000.00 AS SGSTAMT from mainsale wher DATE>=FINALDATE AND DATE<=FINALDATE1 AND invNo=TINVNO1 and company=txcom into tabl mainm
sele 000 AS SL,TYPE,CUSTCODE,HSNCODE,invno,date,name1,spac(20) as name,IIF(TYPE='P',SUM(qty),SUM(QTY*VAL(SIZE))) AS QTY,rate,amount,SUM(SALVAL) AS SALVAL,SUM(SALTAX) AS SALTAX,0000000.00 AS IGSTAMT,0000000.00 AS CGSTAMT,0000000.00 AS SGSTAMT,0000000.00 AS TOTAMT,tax from sale wher DATE>=FINALDATE AND DATE<=FINALDATE1 AND company=txcom and invno=TINVNO1 and qty#0 grou by code,type,RATE,tax into tabl mains
SELECT mainm
USE
SELECT mains
USE

SELE 0
USE MAINM SHAR
SELE 0
USE MAINS SHAR
invoice=MAINM.INVNO
REPL ALL SL WITH RECNO()
*REPL ALL TAX WITH MAINM.GSTTAX
REPL ALL AMOUNT WITH SALVAL
*FOR TYPE='P' 
*AND CUSTCODE=3 
*REPL ALL AMOUNT WITH RATE*(QTY*VAL(SIZE)) FOR TYPE='M' 
*AND CUSTCODE=3 
IF SUBSTR(MAINM.TIN,1,2)#'33'
	REPL ALL IGSTAMT WITH SALTAX
ELSE
	REPL ALL CGSTAMT WITH SALTAX/2
	REPL ALL SGSTAMT WITH SALTAX/2
ENDI
REPL ALL TOTAMT WITH ROUND(AMOUNT+IGSTAMT+CGSTAMT+SGSTAMT,0)
SELECT MAINS
SUM SALVAL TO TSALVAL
SUM SALTAX TO TSATAX
SUM SALTAX/2 TO TCGSTAMT
SUM SALTAX/2 TO TSGSTAMT
SUM TOTAMT TO TTOTAMT

sele mainm
REPLACE SALVAL WITH TSALVAL
IF SUBSTR(MAINM.TIN,1,2)#'33'
	REPLACE IGSTAMT WITH TSALTAX
ELSE
	REPLACE SGSTAMT WITH TSGSTAMT
	REPLACE CGSTAMT WITH TCGSTAMT
ENDIF 
SELECT MAINM
REPLACE ROF WITH GTOT-(SALVAL+SGSTAMT+CGSTAMT)
TJPCODE=MAINM.CUSTCODE
SELECT * FROM PARTY WHERE PCODE=TJPCODE INTO CURSOR TJPARTY

IF LEN(ALLT(TIN))#15 OR "UN-REG"$TIN
	MESSAGEBOX("GST NUMBER NOT ENTERED OR MISTAKE EINVOICE NOT GENERATED ",0,"STORE")
	QUIT
ENDI


xOUT='IRN\IRN'+ALLT(STR(INVOICE))+'.json'
*SET ORDE TO CODE
*SEEK MAINM.CUSTCODE


		set cons off
		set safe off
		set alte to &xOUT
		set alte on
		set safe on



?"	[	"							
?"	{   "								
?'"Version":"1.1",'								
?'	"TranDtls":{'								
?'	               "TaxSch":"GST",'								
?'	               "SupTyp":"B2B",'								
*IF SUBSTR(MAINM.TIN,1,2)#'33'
*	?'	               "IgstOnIntra":"Y",'								
*ELSE
	?'	               "IgstOnIntra":"N",'								
*ENDI

?'	               "RegRev":null,'								
?'	               "EcmGstin":null'								
?'	},'								
?'	"DocDtls":{'								
?'	               "Typ":"INV",'								
?'	               "No":"'+ALLT(STR(MAINM.INVNO))+'",'								

?'	               "Dt":"'+DTOC(MAINM.DATE)+'"'								
?'	},								'

?'	"SellerDtls":{					'			
?'	               "Gstin":"'+ALLT(TJCOMP.GST)+'",'								
?'	               "LglNm":"'+ALLT(TJCOMP.ANAME)+'",'								
?'	               "TrdNm":null,			 '					
?'	               "Addr1":"'+ALLT(TJCOMP.ADD)+'",'						
?'	               "Addr2":"'+ALLT(TJCOMP.ADD1)+'",'
?'	               "Loc":"'+ALLT(TJCOMP.CITY)+'",'
?'	               "Pin":"'+ALLT(TJCOMP.PINCODE)+'",'
?'	               "Stcd":"33",				 '				
?'	               "Ph":null,				 '				
?'	               "Em":null				 '				
?'	},'								
?'	"BuyerDtls":{'								
?'	               "Gstin":"'+ALLT(TJPARTY.TIN)+'",'								
?'	               "LglNm":"'+ALLTRIM(TJPARTY.PNAME)+'",  '								
?'	               "TrdNm":null,			 '					
?'	               "Pos":"'+SUBSTR(TJPARTY.TIN,1,2)+'",				 '	 			
?'	               "Addr1":"'+TJPARTY.ADD1+'", 		 '						
?'	               "Addr2":"'+TJPARTY.ADD2+'",			 '					
?'	               "Loc":"'+TJPARTY.CITY+'", 		 '						
?'	               "Pin":"'+ALLTRIM(TJPARTY.PINCODE)+'",  			 '					
?'	               "Stcd":"'+SUBSTR(ALLT(TJPARTY.TIN),1,2)+'",  			 '					
?'	               "Ph":null,				 '				
?'	               "Em":null				 '				
?'	},'								
?'	"DispDtls":null,'								
?'	"ShipDtls":null,'								
?'	"ValDtls":{		'						
?'	               "AssVal":'+ALLT(STR(MAINM.SALVAL,12,2))+','								
?'	               "IgstVal":'+ALLT(STR(MAINM.IGSTAMT,12,2))+',   '            								
?'	               "CgstVal":'+ALLT(STR(MAINM.CGSTAMT,12,2))+',   '            								
?'	               "SgstVal":'+ALLT(STR(MAINM.SGSTAMT,12,2))+',   '            								
?'	               "CesVal":0,    '           								
?'	               "StCesVal":0,  '             								
?'	               "Discount":0,  '             								
?'	               "OthChrg":0,	  '							
?'	               "RndOffAmt":'+ALLT(STR(MAINM.ROF,7,2))+','								
?'	               "TotInvVal":'+ALLT(STR(MAINM.GTOT,12,2))+','               								
?'	               "TotInvValFc":0	'							
?'	},'								
?'	"ExpDtls":null,'
*{'								
*?'	               "ShipBNo":"1234",	'							
*?'	               "ShipBDt":"29/07/2020",'								
*?'	               "Port":"innrp6",		  '					
*?'	               "RefClm":"Y",		  '						
*?'	               "ForCur":"aed",		  ' 						
*?'	               "CntCode":"ad",		  '						
*?'	               "ExpDuty":0			  '					
*?'	},'								
?'	"EwbDtls":null,'
*{'								
*?'	               "TransId":"33AADFA4747M1ZD",	'							
*?'	               "TransName":"jjjj",			'					
*?'	               "TransMode":"1",				'				
*?'	               "Distance":32,				'				
*?'	               "TransDocNo":"223",			'					
*?'	               "TransDocDt":"11/08/2020",	'							
*?'	               "VehNo":"TN59AF1234",		'						
*?'	               "VehType":"R"				'				
*?'	},'								
?'	"PayDtls":null,'
*{'								
*?'	               "Nm":"AHAMED",				'				
*?'	               "AccDet":"1234567890123",	'							
*?'	               "Mode":"Cash",				'				
*?'	               "FinInsBr":"SBI",			'					
*?'	               "PayTerm":"CREDIT",			'					
*?'	               "PayInstr":"FDGD",			'					
*?'	               "CrTrn":"Credit Transfer",	'							
*?'	               "DirDr":"direct debit",		'						
*?'	               "CrDay":30,					'			
*?'	               "PaidAmt":3243,				'				
*?'	               "PaymtDue":345				'				
*?'	},'								
?'	"RefDtls":null,'
*{'								

*?'	               "InvRm":"sdsfsf",			'					
*?'	               "DocPerdDtls":{               '								
*?'	                       "InvStDt":"01/08/2020",'								
*?'	                       "InvEndDt":"01/08/2020"	'							
*?'	                             },					'			
*?'	               "PrecDocDtls":[					'			
*?'	                              {					'			
*?'	                               "InvNo":"11113",	'							
*?'	                               "InvDt":"01/08/2020",'								
*?'	                               "OthRefNo":"lklkjkl"	'							
*?'	                              }						'		
*?'	                              ],					'			
*?'	               "ContrDtls":[						'		
*?'	                              {						'		
*?'	                               "RecAdvRefr":"1233654",'								
*?'	                               "RecAdvDt":"01/08/2020",'								
*?'	                               "TendRefr":"545545",		'						
*?'	                               "ContrRefr":"658987",     '               								
*?'	                               "ExtRefr":"2563",         '           								
*?'	                               "ProjRefr":"456jih",      '              								
*?'	                               "PORefr":"gjhjj35j",      '              								
*?'	                               "PORefDt":"01/08/2020"	 '							
*?'	                              }							'	
*?'	                              ]							'	
*?'	},'								
?'	"AddlDocDtls":[	'							
?'	{'								
?'	               "Url":"https://einv-apisandbox.nic.in/einv_web_test/Invoice/BulkUpload",	'							
?'	               "Docs":"FGFD",	'							
?'	               "Info":"FFGFD"	'							
?'	}'								
?'	],'								
?'	                         "ItemList":[{			'					

SELE MAINS
GO TOP
DO WHILE !EOF()
IF SL>1
	?','
	?'{'
ENDI	

?'	                                "SlNo":"'+ALLT(STR(SL))+'",		'						
?'	                                "PrdDesc":"'+ALLT(NAME)+'",	'							
?'	                                "IsServc":"N",	'							
?'	                                "HsnCd":"'+ALLT(HSNCODE)+'",	'							
?'	                                "Barcde":null,	'							
?'	                                "Qty":'+ALLT(STR(QTY,8,2))+',		'						
?'	                                "FreeQty":0,	'							
IF TYPE='P'
	?'	                                "Unit":"NOS",	'							
ELSE
	?'	                                "Unit":"KGS",	'							
ENDI

?'	                                "UnitPrice":'+ALLT(STR(RATE,10,2))+','								
?'	                                "TotAmt":'+ALLT(STR(AMOUNT,10,2))+',		'						
?'	                                "Discount":0,		'						
?'	                                "PreTaxVal":0,		'						
?'	                                "AssAmt":'+ALLT(STR(AMOUNT,10,2))+',		'						
?'	                                "GstRt":'+ALLT(STR(TAX,10,2))+',			'					
?'	                                "IgstAmt":'+STR(IGSTAMT,12,2)+',		'						
?'	                                "CgstAmt":'+STR(CGSTAMT,12,2)+',		'						
?'	                                "SgstAmt":'+STR(SGSTAMT,12,2)+',		'						
?'	                                "CesRt":0, 			'					
?'	                               "CesAmt":0, 			'					
?'	                               "CesNonAdvlAmt":0,	'							
?'	                               "StateCesRt":0,		'						
?'	                               "StateCesAmt":0,		'						
?'	                               "StateCesNonAdvlAmt":0,'								
?'	                               "OthChrg":0, 			'					
?'	                               "TotItemVal":'+ALLT(STR(TOTAMT,12,2))+',		'						
?'	                                "OrdLineRef":null, 		'						
?'	                               "OrgCntry":null, 		'						
?'	                               "PrdSlNo":null,			'					
IF !EOF()
	?'	                               "BchDtls":null			'					
ELSE
	?'	                               "BchDtls":null,			'					
ENDI
*?'	                                "AttribDtls":[{			'					
*?'	                                    "Nm":null, 			'					
*?'	                                    "Val":null			'					
?'	                              }							'	
SELE MAINS
SKIP
LOOP
ENDD
*	?'	                              }							'	
	?'	                              ]							'

?''	                              	
?'	}]'								
??

	set alte off
	set alte to



set talk off

clear

hand = fopen(xout,2)
fsize = FSEEK(hand,0,2)   && Determine file size, assign to
org_s = fsize
fsize = fseek(hand,fsize-1)
l_string = FREAD(hand, fsize)
if l_string = chr(26)
 = FCHSIZE(hand, org_s-1)
endif
= FCLOSE(hand)
*return


set safe off
FILENAME="irn\Qinv\"+ALLTRIM(STR(mainm.invno))+".JSON"

IF FILE(filename)

LOCAL lnFileHandle && numeric file handle

lnFileHandle = FOPEN(FILENAME)

LOCAL lcLine && define a variable to hold each line
TOTLINE=""
DO WHILE NOT FEOF( lnFileHandle) && loop through the file
	lcLine = FGETS( lnFileHandle) && store each line in lcLine
	TOTLINE=ALLTRIM(TOTLINE)+ALLTRIM(LCLINE)
ENDDO

	T='"AckNo":'
	T1='"AckDt"'
	T2='"Irn":"'
	T3='"SignedInvoice":"'
	T4='"SignedQRCode"'
	T5='"Status":'
	
	IF AT(T,TOTLINE)#0
		X1=AT(T,TOTLINE)
	ENDIF 
	IF AT(T1,TOTLINE)#0
		X2=AT(T1,TOTLINE)
	ENDIF 
	IF AT(T2,TOTLINE)#0
		X3=AT(T2,TOTLINE)
   	ENDIF 
	IF AT(T3,TOTLINE)#0
		X4=AT(T3,TOTLINE)
   	ENDIF 
   	IF AT(T4,TOTLINE)#0
	   	X5=AT(T4,TOTLINE)
	ENDIF 
   	IF AT(T5,TOTLINE)#0
		X6=AT(T5,TOTLINE)
	ENDIF 
	xlen=(X6-2)-(X5+16)
	xlen1=(X4-2)-(X3+7)
	xlen2=(X3-2)-(X2+9)
	
	TACK=SUBSTR(TOTLINE,X1+8,15)

	TIRN=SUBSTR(TOTLINE,X3+7,XLEN1)

	TACKDT=SUBSTR(TOTLINE,X2+9,XLEN2)

	QR=SUBSTR(TOTLINE,X5+16,xlen)

	TOFILE="irn/QIMAGE/Q"+ALLTRIM(STR(mainm.invno))+".JSON"
	
	h = FCREATE(TOFile)
	FWRITE(h,QR )
	FCLOSE(h)
	
FCLOSE( lnFileHandle) && don't forget to close the file

sele mainm
REPLACE ackno WITH tack
REPLACE irn WITH tirn
REPLACE ACKDATE WITH TACKDT 

TOFILEG="irn/qimage/qrc"+ALLTRIM(STR(mainm.invno))+".jpg"


tt='Java -jar QRC.jar '+'"'+tofile+'"'+' "'+tofileg+'"'

*WAIT WINDOW "CREATING QR CODE FOR EINVOICE" 
WAIT TIMEOUT 5  

run/n &tt
ENDIF

IF USED("PARTY")
	SELECT PARTY
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

#!/bin/bash

last_log_file="/var/log/backup-last.log"
last_mail_log_file="/var/log/mail-last.log"
last_microsoft_teams_log_file="/var/log/microsoft-teams-last.log"
cron_log_file="/var/log/cron.log"
export TZ=UTC

prefix() {
	awk '{ print "[restic.backup]", $0 }'
}

get_date() {
	date +'%FT%H-%M-%SZ'
}

log_output() {
	if [[ "${LOG_RESTIC_OUTPUT:-}" == "false" ]]; then
		prefix >> ${last_log_file}
	else
		prefix | tee -a ${last_log_file} >> ${cron_log_file}
	fi
}

copy_error_log() {
	cp ${last_log_file} /var/log/backup-error-last.log
}

log_last() {
	echo "$1" | log_output
}

backup_success() {
	# this checks the log output instead of the
	# exit code because I don't care that much if
	# a few files can't be read. If a snapshot is
	# saved, I consider that successful.
	# todo: revisit this maybe?
	if grep -qE "^\[restic\.backup\] snapshot \w+ saved$" "$last_log_file"; then
		echo "success"
	else
		echo "fail"
	fi
}

# ======================== #
# ========= MAIN ========= #
# ======================== #

if [ -f "/hooks/pre-backup.sh" ]; then
	echo "Starting pre-backup script ..."
	/hooks/pre-backup.sh
else
	echo "Pre-backup script not found ..."
fi

if [[ -n "${SENTRY_CRONS:-}" ]]; then
	echo "Notifying sentry (start) ..."
	curl -v "${SENTRY_CRONS}?status=in_progress"
fi

start=`date +%s`
rm -f ${last_log_file} ${last_mail_log_file}
echo "Starting Backup at $(get_date)"
log_last "Starting Backup at $(get_date)"
log_last "BACKUP_CRON: ${BACKUP_CRON}"
log_last "RESTIC_TAG: ${RESTIC_TAG}"
log_last "RESTIC_FORGET_ARGS: ${RESTIC_FORGET_ARGS}"
log_last "RESTIC_JOB_ARGS: ${RESTIC_JOB_ARGS}"
log_last "RESTIC_REPOSITORY: ${RESTIC_REPOSITORY}"
log_last "AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}"

# Do not save full backup log to logfile but to backup-last.log
restic backup /data ${RESTIC_JOB_ARGS} --tag=${RESTIC_TAG?"Missing environment variable RESTIC_TAG"} 2>&1 | log_output
backup_rc=${PIPESTATUS[0]}
log_last "Finished backup at $(get_date)"
if [[ $backup_rc == 0 ]]; then
	echo "Backup Successful"
else
	echo "Backup Failed with Status ${backup_rc}"
	restic unlock 2>&1 | log_output
	copy_error_log
fi

if [[ $backup_rc == 0 ]] && [ -n "${RESTIC_FORGET_ARGS}" ]; then
	echo "Forget about old snapshots based on RESTIC_FORGET_ARGS = ${RESTIC_FORGET_ARGS}"
	restic forget ${RESTIC_FORGET_ARGS} 2>&1 | log_output
	rc=${PIPESTATUS[0]}
	log_last "Finished forget at $(get_date)"
	if [[ $rc == 0 ]]; then
		echo "Forget Successful"
	else
		echo "Forget Failed with Status ${rc}"
		restic unlock 2>&1 | log_output
		copy_error_log
	fi
fi

end=`date +%s`
echo "Finished Backup at $(get_date) after $((end-start)) seconds"

if [ -n "${TEAMS_WEBHOOK_URL}" ]; then
	teams_title="Restic Last Backup Log"
	teams_message=$( cat ${last_log_file} | sed 's/"/\"/g' | sed "s/'/\'/g" | sed ':a;N;$!ba;s/\n/\n\n/g' )
	teams_req_body="{\"title\": \"${teams_title}\", \"text\": \"${teams_message}\" }"
	sh -c "curl -H 'Content-Type: application/json' -d '${teams_req_body}' '${TEAMS_WEBHOOK_URL}' > ${last_microsoft_teams_log_file} 2>&1"
	if [ ${PIPESTATUS[0]} == 0 ]; then
		echo "Microsoft Teams notification successfully sent."
	else
		echo "Sending Microsoft Teams notification FAILED. Check ${last_microsoft_teams_log_file} for further information."
	fi
fi

if [ -n "${MAILX_ARGS}" ]; then
	sh -c "mail -v -S sendwait ${MAILX_ARGS} < ${last_log_file} > ${last_mail_log_file} 2>&1"
	if [ ${PIPESTATUS[0]} == 0 ]; then
		echo "Mail notification successfully sent."
	else
		echo "Sending mail notification FAILED. Check ${last_mail_log_file} for further information."
	fi
fi

if [[ -n "${SENTRY_CRONS:-}" ]]; then
	outcome="$(backup_success)"
	echo "Notifying sentry (end_$outcome) ..."
	if [[ "$outcome" == "success" ]]; then
		curl -v "${SENTRY_CRONS}?status=ok"
	else
		curl -v "${SENTRY_CRONS}?status=error"
	fi
fi

if [ -f "/hooks/post-backup.sh" ]; then
	echo "Starting post-backup script ..."
	/hooks/post-backup.sh $backup_rc
else
	echo "Post-backup script not found ..."
fi

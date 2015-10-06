class TracksController < ApplicationController
  require "digest"

  before_filter :get_track, :only => [:show, :update, :previous, :next]

  # dirty hack to respond to OPTIONS request_method of XSS ajax calls
  def options_response
     render :nothing => true, :status => 200

    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '86400' # 24 hours
    response.headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  end

  def get_track
    begin
      @track = Track.find(params[:id])

      if !@track.active
        @track = nil
      end
    rescue ActiveRecord::RecordNotFound
      @track = nil
    end
  end

  def new
    respond_to do |format|
      format.html

      format.json do
        render :partial => "tracks/new.json"
      end
    end
  end

  def show
    track_response
  end

  def previous
    if @track
      begin
        @track = @track.previous
      rescue ActiveRecord::RecordNotFound
        @track = nil
      end
    end

    track_response
  end

  def next
    if @track
      begin
        @track = @track.next
      rescue ActiveRecord::RecordNotFound
        @track = nil
      end
    end

    track_response
  end

  def create
    respond_to do |format|
      format.html

      format.json do
        track = Track.new(params[:track])

        if track.valid?
          if track.save
            redirect_to Track
          else
            render :partial => "tracks/errors/unable_to_save.json", :status => 500
          end
        else
          render :partial => "tracks/errors/invalid_track.json", :status => 400
        end
      end
    end
  end

  def track_response
    if @track
      respond_to do |format|
        format.html

        format.json do
          render :partial => "tracks/show.json", :locals => { :track => @track }
        end
      end
    else
      respond_to do |format|
        format.html do
          render :status => 404
        end

        format.json do
          render :partial => "tracks/errors/not_found.json", :status => 404
        end
      end
    end
  end

  def info
    total_length = MarbleRun.first.total_length
    last_unlock = Unlock.where(is_unlocked: true).order("minimum_length DESC").first
    next_unlock = Unlock.where(is_unlocked: false).order("minimum_length ASC").first
    latest_track = Track.where(active: true).order("created_at DESC").first

    if last_unlock && next_unlock
      needed_length = next_unlock.minimum_length - last_unlock.minimum_length
      current_length = total_length - last_unlock.minimum_length

      percentage = current_length.to_f / needed_length.to_f
    else
      percentage = 1
    end

    info_hash = Hash.new
    info_hash['latest_track'] = latest_track.json_track
    info_hash['total_length'] = total_length
    info_hash['percentage'] = percentage

    respond_to do |format|
      format.html do
        render :partial => "tracks/info.json", :locals => { :info_hash => info_hash }
      end

      format.json do
        render :partial => "tracks/info.json", :locals => { :info_hash => info_hash }
      end
    end
  end

  def index
    if params[:page]
      page = params[:page]
    else
      page = 1
    end

    if params[:search]
      params[:search] = '%' + params[:search] + '%'

      @tracks = Track.where(active: true).where('(username LIKE ? OR trackname LIKE?)', params[:search], params[:search]).order('created_at DESC').paginate(page: page)
    elsif params[:sorting] == 'likes'
      @tracks = Track.where(active: true).order('likes DESC').paginate(page: page)
    else
      @tracks = Track.where(active: true).order('created_at DESC').paginate(page: page)
    end

    tracks = Array.new

    @tracks.each do |track|
      tracks.push track.json_track
    end

    response_hash = Hash.new

    response_hash['mode'] = "overview"
    response_hash['tracks'] = tracks
    response_hash['current_page'] = @tracks.current_page
    response_hash['total_pages'] = @tracks.total_pages

    respond_to do |format|
      format.html

      format.json do
        render :partial => "tracks/index.json", :locals => { :response_hash => response_hash }
      end
    end
  end

  def update
    hash_string = request.user_agent + request.ip + Date.today.to_s + @track.id.to_s
    hash = Digest::MD5.hexdigest(hash_string)

    if params[:likes]
      like = Like.new(:hash => hash)

      if like.valid?
        @track.likes += 1
        @track.save
        like.save

        render :nothing => true, :status => 200
      else
        render :nothing => true, :status => 500
      end
    elsif params[:flags]
      flag = Flag.new(:hash => hash)

      if flag.valid?
        @track.flags += 1

        if @track.flags > 5 && @track.flags > @track.likes / 10
          @track.active = false
        end

        @track.save
        flag.save

        render :nothing => true, :status => 200
      else
        render :nothing => true, :status => 500
      end
    else
      render :nothing => true, :status => 500
    end
  end
end
